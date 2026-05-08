#!/usr/bin/env python3
"""
来週の空きMTGスロット検索スクリプト
- 1時間のMTGが入れられる空き時間を列挙
- 他社MTG（社外イベント）の前後30分はバッファとして除外
"""

import sys
from datetime import datetime, timezone, timedelta, time
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
SCRIPTS_DIR = Path(__file__).resolve().parent
TOKEN_FILE = SCRIPTS_DIR / "token.json"
CREDS_FILE = SCRIPTS_DIR / "credentials.json"

JST = timezone(timedelta(hours=9))
WEEKDAY_JA = ["月", "火", "水", "木", "金", "土", "日"]

# 業務時間（この範囲内の空きを表示）
WORK_START = time(9, 0)
WORK_END = time(21, 0)

# 社外MTGと判定するキーワード（タイトルに含まれていれば社外扱い）
# 含まれていないものも社外の可能性があるため、
# WEBチームタスク管理など社内定例を社内として扱う
INTERNAL_KEYWORDS = [
    "WEBチームタスク管理",
    "タスク管理MTG",
    "社内",
    "チーム",
    "1on1",
]


def is_internal(summary: str) -> bool:
    return any(kw in summary for kw in INTERNAL_KEYWORDS)


def get_service():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            from google_auth_oauthlib.flow import InstalledAppFlow
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())
    return build("calendar", "v3", credentials=creds)


def get_week_events(service, monday: datetime) -> dict[str, list]:
    """月〜金のイベントを日付ごとに取得"""
    week_events = {}
    for i in range(5):
        day = monday + timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, 0, 0, 0, tzinfo=JST)
        day_end = day_start + timedelta(days=1)
        result = service.events().list(
            calendarId="primary",
            timeMin=day_start.isoformat(),
            timeMax=day_end.isoformat(),
            singleEvents=True,
            orderBy="startTime",
        ).execute()
        week_events[day.strftime("%Y-%m-%d")] = result.get("items", [])
    return week_events


def to_dt(s: str) -> datetime:
    return datetime.fromisoformat(s).astimezone(JST)


def find_free_slots(events: list, date: datetime) -> list[tuple[datetime, datetime]]:
    """
    1時間の空きスロットを返す。
    社外MTGの前後30分はバッファとして使用済み扱い。
    """
    base = date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=JST)
    work_start_dt = base.replace(hour=WORK_START.hour, minute=WORK_START.minute)
    work_end_dt = base.replace(hour=WORK_END.hour, minute=WORK_END.minute)

    # 終日イベントを除外し、時刻付きイベントのみ処理
    timed_events = [e for e in events if "dateTime" in e.get("start", {})]

    # ブロック済み時間帯を構築（イベント本体 + 社外MTGのバッファ）
    blocked: list[tuple[datetime, datetime]] = []
    for e in timed_events:
        s = to_dt(e["start"]["dateTime"])
        en = to_dt(e["end"]["dateTime"])
        blocked.append((s, en))
        # 社外MTGならバッファを追加
        if not is_internal(e.get("summary", "")):
            buf_start = s - timedelta(minutes=30)
            buf_end = en + timedelta(minutes=30)
            blocked.append((buf_start, buf_end))

    # マージ
    blocked = sorted(blocked, key=lambda x: x[0])
    merged: list[tuple[datetime, datetime]] = []
    for s, e in blocked:
        if merged and s <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))

    # 空き時間を列挙（業務時間内 & 60分以上）
    free_slots = []
    cursor = work_start_dt
    for s, e in merged:
        if s > cursor and (s - cursor) >= timedelta(hours=1):
            slot_start = cursor
            slot_end = min(s, work_end_dt)
            if slot_end > slot_start:
                free_slots.append((slot_start, slot_end))
        cursor = max(cursor, e)
    # 最後のイベント後
    if cursor < work_end_dt and (work_end_dt - cursor) >= timedelta(hours=1):
        free_slots.append((cursor, work_end_dt))

    return free_slots


def format_slots(slots: list[tuple[datetime, datetime]]) -> list[str]:
    """空きスロットを「HH:MM〜HH:MM（X時間）」形式に"""
    lines = []
    for s, e in slots:
        duration_min = int((e - s).total_seconds() / 60)
        if duration_min >= 120:
            dur_str = f"{duration_min // 60}時間{duration_min % 60:02d}分" if duration_min % 60 else f"{duration_min // 60}時間"
        else:
            dur_str = f"{duration_min}分"
        lines.append(f"  {s:%H:%M}〜{e:%H:%M}（{dur_str}の余白）")
    return lines


def main():
    # 来週の月曜を計算
    today = datetime.now(JST)
    days_until_monday = (7 - today.weekday()) % 7 or 7
    monday = today + timedelta(days=days_until_monday)
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)

    print(f"=== 来週（{monday:%Y/%m/%d}〜{monday + timedelta(days=4):%m/%d}）の空きMTGスロット ===\n")

    service = get_service()
    week_events = get_week_events(service, monday)

    for i in range(5):
        day = monday + timedelta(days=i)
        date_key = day.strftime("%Y-%m-%d")
        events = week_events[date_key]
        weekday = WEEKDAY_JA[day.weekday()]

        print(f"【{day:%m/%d}（{weekday}）】")

        # 既存イベント表示
        timed = [e for e in events if "dateTime" in e.get("start", {})]
        all_day = [e for e in events if "date" in e.get("start", {}) and "dateTime" not in e.get("start", {})]

        if not events:
            print("  予定なし")
        else:
            for e in all_day:
                print(f"  終日　{e.get('summary', '(no title)')}")
            for e in timed:
                s = to_dt(e["start"]["dateTime"])
                en = to_dt(e["end"]["dateTime"])
                label = "" if is_internal(e.get("summary", "")) else " ※社外"
                print(f"  {s:%H:%M}-{en:%H:%M}　{e.get('summary', '(no title)')}{label}")

        # 空きスロット
        free = find_free_slots(events, day)
        if free:
            print("  ▼ 1時間MTGが入れられる空き枠")
            for line in format_slots(free):
                print(line)
        else:
            print("  ▼ 空き枠なし")
        print()


if __name__ == "__main__":
    main()
