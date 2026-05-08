#!/usr/bin/env python3
"""
Google カレンダー → 日報スケジュール自動反映スクリプト
使い方:
  python3 gcal_to_nippou.py          # 今日の日報を作成/更新
  python3 gcal_to_nippou.py 20260510 # 指定日の日報を作成/更新
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

BASE_DIR = Path(__file__).resolve().parent.parent  # 株式会社 HON/
NIPPOU_DIR = BASE_DIR / "06_日報"
CREDS_FILE = Path(__file__).resolve().parent / "credentials.json"
TOKEN_FILE = Path(__file__).resolve().parent / "token.json"

JST = timezone(timedelta(hours=9))

WEEKDAY_JA = ["月", "火", "水", "木", "金", "土", "日"]

# ─────────────────────────────────────────────
# Google Calendar 認証
# ─────────────────────────────────────────────
def get_calendar_service():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CREDS_FILE.exists():
                print(f"[エラー] credentials.json が見つかりません: {CREDS_FILE}")
                print("  → Google Cloud Console でOAuth 2.0クライアントIDを作成し、")
                print("    credentials.json を scripts/ フォルダに置いてください。")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("calendar", "v3", credentials=creds)


# ─────────────────────────────────────────────
# カレンダーイベント取得
# ─────────────────────────────────────────────
def get_events(service, date: datetime) -> list[dict]:
    day_start = datetime(date.year, date.month, date.day, 0, 0, 0, tzinfo=JST)
    day_end = day_start + timedelta(days=1)

    result = service.events().list(
        calendarId="primary",
        timeMin=day_start.isoformat(),
        timeMax=day_end.isoformat(),
        singleEvents=True,
        orderBy="startTime",
    ).execute()

    return result.get("items", [])


def format_event_line(event: dict) -> str:
    """イベントを日報形式の1行に変換"""
    start = event["start"]
    end = event["end"]
    summary = event.get("summary", "(タイトルなし)")

    # 終日イベント
    if "date" in start:
        return f"- 終日　{summary}"

    start_dt = datetime.fromisoformat(start["dateTime"]).astimezone(JST)
    end_dt = datetime.fromisoformat(end["dateTime"]).astimezone(JST)

    return f"- {start_dt:%H:%M} - {end_dt:%H:%M}　{summary}"


# ─────────────────────────────────────────────
# 日報ファイル 作成 / 更新
# ─────────────────────────────────────────────
def make_template(date: datetime, schedule_lines: list[str]) -> str:
    weekday = WEEKDAY_JA[date.weekday()]
    date_str = date.strftime("%Y-%m-%d")
    schedule_block = "\n".join(schedule_lines) if schedule_lines else "- (予定なし)"

    return f"""# 日報 {date_str}（{weekday}）

## 本日のスケジュール

{schedule_block}

## 本日のタスク

- [ ]

## AIアドバイス

## 今日やったこと
-

## 気づき・メモ
-

## 明日やること
-

## 食事記録

- 朝：
- 昼：
- 夜：
- 間食：

## 運動記録

-
"""


def update_schedule_section(content: str, schedule_lines: list[str]) -> str:
    """既存ファイルの「本日のスケジュール」セクションだけ差し替える"""
    schedule_block = "\n".join(schedule_lines) if schedule_lines else "- (予定なし)"
    lines = content.splitlines(keepends=True)
    new_lines = []
    in_schedule = False
    replaced = False

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped == "## 本日のスケジュール":
            new_lines.append(line)
            new_lines.append("\n")
            new_lines.append(schedule_block + "\n")
            in_schedule = True
            replaced = True
            i += 1
            # 次の ## セクションまでスキップ
            while i < len(lines):
                if lines[i].strip().startswith("## "):
                    break
                i += 1
            continue

        new_lines.append(line)
        i += 1

    if not replaced:
        # セクションがなければ末尾に追加
        new_lines.append("\n## 本日のスケジュール\n\n")
        new_lines.append(schedule_block + "\n")

    return "".join(new_lines)


# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────
def main():
    # 対象日の決定
    if len(sys.argv) >= 2:
        try:
            date = datetime.strptime(sys.argv[1], "%Y%m%d").replace(tzinfo=JST)
        except ValueError:
            print("[エラー] 日付は YYYYMMDD 形式で指定してください（例: 20260510）")
            sys.exit(1)
    else:
        date = datetime.now(JST)

    date_label = date.strftime("%Y%m%d")
    nippou_path = NIPPOU_DIR / f"{date_label}.md"

    print(f"対象日: {date.strftime('%Y-%m-%d (%a)')}")
    print(f"日報ファイル: {nippou_path}")

    # カレンダー取得
    service = get_calendar_service()
    events = get_events(service, date)

    if not events:
        print("  → カレンダーに予定はありませんでした。")
    else:
        print(f"  → {len(events)} 件の予定を取得しました。")

    schedule_lines = [format_event_line(e) for e in events]

    # 日報ファイル 作成 or 更新
    if nippou_path.exists():
        original = nippou_path.read_text(encoding="utf-8")
        updated = update_schedule_section(original, schedule_lines)
        nippou_path.write_text(updated, encoding="utf-8")
        print("  → 既存の日報を更新しました（スケジュール欄を置き換え）。")
    else:
        NIPPOU_DIR.mkdir(parents=True, exist_ok=True)
        content = make_template(date, schedule_lines)
        nippou_path.write_text(content, encoding="utf-8")
        print("  → 新しい日報ファイルを作成しました。")

    print(f"\n完了: {nippou_path}")


if __name__ == "__main__":
    main()
