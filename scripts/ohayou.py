#!/usr/bin/env python3
"""
おはようルーティンスクリプト
- Google カレンダーから本日の予定を取得
- Backlog から自分にアサインされた未完了タスクを取得
- 日報ファイルを作成/更新

使い方:
  python3 scripts/ohayou.py
"""

import sys
import os
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
import urllib.request
import urllib.parse


# ─────────────────────────────────────────────
# .env 読み込み
# ─────────────────────────────────────────────
def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip())


load_env()

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False


# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
BASE_DIR = Path(__file__).resolve().parent.parent
NIPPOU_DIR = BASE_DIR / "06_日報"
CREDS_FILE = Path(__file__).resolve().parent / "credentials.json"
TOKEN_FILE = Path(__file__).resolve().parent / "token.json"
JST = timezone(timedelta(hours=9))
WEEKDAY_JA = ["月", "火", "水", "木", "金", "土", "日"]

BACKLOG_SPACE = os.environ.get("BACKLOG_SPACE", "")
BACKLOG_API_KEY = os.environ.get("BACKLOG_API_KEY", "")
BACKLOG_PROJECT_KEY = os.environ.get("BACKLOG_PROJECT_KEY", "")


# ─────────────────────────────────────────────
# Google Calendar
# ─────────────────────────────────────────────
def get_calendar_service():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("calendar", "v3", credentials=creds)


def get_calendar_events(date: datetime) -> list:
    if not GOOGLE_AVAILABLE:
        return []
    service = get_calendar_service()
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
    start = event["start"]
    end = event["end"]
    summary = event.get("summary", "(タイトルなし)")
    if "date" in start:
        return f"- 終日　{summary}"
    start_dt = datetime.fromisoformat(start["dateTime"]).astimezone(JST)
    end_dt = datetime.fromisoformat(end["dateTime"]).astimezone(JST)
    return f"- {start_dt:%H:%M} - {end_dt:%H:%M}　{summary}"


# ─────────────────────────────────────────────
# Backlog API
# ─────────────────────────────────────────────
def backlog_get(path: str, params: list = None):
    base_params = [("apiKey", BACKLOG_API_KEY)]
    if params:
        base_params.extend(params)
    query = urllib.parse.urlencode(base_params)
    url = f"https://{BACKLOG_SPACE}/api/v2{path}?{query}"
    with urllib.request.urlopen(url, timeout=10) as res:
        return json.loads(res.read())


def get_backlog_my_issues() -> list:
    """自分にアサインされた未完了タスクを取得"""
    if not BACKLOG_SPACE or not BACKLOG_API_KEY:
        return []

    try:
        myself = backlog_get("/users/myself")
        user_id = myself["id"]

        project = backlog_get(f"/projects/{BACKLOG_PROJECT_KEY}")
        project_id = project["id"]

        # statusId: 1=未対応, 2=処理中, 3=処理済み（4=完了は除外）
        issues = backlog_get("/issues", [
            ("projectId[]", project_id),
            ("assigneeId[]", user_id),
            ("statusId[]", 1),
            ("statusId[]", 2),
            ("statusId[]", 3),
            ("order", "updated"),
            ("count", 30),
        ])
        return issues

    except Exception as e:
        print(f"  [Backlog] エラー: {e}")
        return []


def format_backlog_task(issue: dict) -> str:
    issue_key = issue.get("issueKey", "")
    summary = issue.get("summary", "")
    due_date = issue.get("dueDate", "")
    if due_date:
        due_dt = datetime.fromisoformat(due_date.replace("Z", "+00:00")).astimezone(JST)
        return f"- [ ] [{issue_key}] {summary}（期限: {due_dt.strftime('%Y-%m-%d')}）"
    return f"- [ ] [{issue_key}] {summary}"


# ─────────────────────────────────────────────
# 日報テンプレート
# ─────────────────────────────────────────────
def make_template(date: datetime, schedule_lines: list, task_lines: list) -> str:
    weekday = WEEKDAY_JA[date.weekday()]
    date_str = date.strftime("%Y-%m-%d")
    schedule_block = "\n".join(schedule_lines) if schedule_lines else "- なし"
    task_block = "\n".join(task_lines) if task_lines else "- [ ] "

    return f"""# 日報 {date_str}（{weekday}）

## 本日のスケジュール

{schedule_block}

## 本日のタスク

{task_block}

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


def update_schedule_section(content: str, schedule_lines: list) -> str:
    """スケジュールセクションを差し替える"""
    schedule_block = "\n".join(schedule_lines) if schedule_lines else "- なし"
    lines = content.splitlines(keepends=True)
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip() == "## 本日のスケジュール":
            new_lines.append(line)
            new_lines.append("\n")
            new_lines.append(schedule_block + "\n")
            new_lines.append("\n")
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("## "):
                i += 1
            continue
        new_lines.append(line)
        i += 1
    return "".join(new_lines)


def update_task_section(content: str, task_lines: list) -> str:
    """タスクセクションを差し替える（既にタスクが入力済みの場合はスキップ）"""
    lines = content.splitlines(keepends=True)
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip() == "## 本日のタスク":
            # 既存タスクを確認
            j = i + 1
            existing = []
            while j < len(lines) and not lines[j].strip().startswith("## "):
                t = lines[j].strip()
                if t.startswith("- ["):
                    existing.append(t)
                j += 1

            has_real_tasks = any(t not in ("- [ ]", "- [ ] ") for t in existing)

            if has_real_tasks:
                # 既入力タスクはそのまま保持
                new_lines.append(line)
                i += 1
            else:
                # 空なら Backlog から補完
                task_block = "\n".join(task_lines) if task_lines else "- [ ] "
                new_lines.append(line)
                new_lines.append("\n")
                new_lines.append(task_block + "\n")
                i = j
            continue
        new_lines.append(line)
        i += 1
    return "".join(new_lines)


# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────
def main():
    date = datetime.now(JST)
    date_label = date.strftime("%Y%m%d")
    nippou_path = NIPPOU_DIR / f"{date_label}.md"

    print(f"\n{'=' * 50}")
    print(f"おはようございます！  {date.strftime('%Y-%m-%d (%a)')}")
    print(f"{'=' * 50}\n")

    # 1. Google カレンダー
    print("📅 Google カレンダーを確認中...")
    schedule_lines = []
    try:
        events = get_calendar_events(date)
        if events:
            schedule_lines = [format_event_line(e) for e in events]
            print(f"  → {len(events)} 件の予定を取得")
            for line in schedule_lines:
                print(f"    {line}")
        else:
            schedule_lines = ["- なし"]
            print("  → 本日の予定はありません")
    except Exception as e:
        schedule_lines = ["- (取得エラー)"]
        print(f"  → エラー: {e}")

    # 2. Backlog タスク
    print("\n📋 Backlog タスクを確認中...")
    task_lines = []
    issues = get_backlog_my_issues()
    if issues:
        print(f"  → {len(issues)} 件のタスクを取得")
        for issue in issues:
            line = format_backlog_task(issue)
            task_lines.append(line)
            print(f"    {line}")
    else:
        print("  → タスクなし（またはエラー）")

    # 3. 日報 作成 or 更新
    print(f"\n📝 日報を更新中: {nippou_path.name}")
    if nippou_path.exists():
        content = nippou_path.read_text(encoding="utf-8")
        content = update_schedule_section(content, schedule_lines)
        content = update_task_section(content, task_lines)
        nippou_path.write_text(content, encoding="utf-8")
        print("  → 既存の日報を更新しました（スケジュール・タスクを反映）")
    else:
        NIPPOU_DIR.mkdir(parents=True, exist_ok=True)
        content = make_template(date, schedule_lines, task_lines)
        nippou_path.write_text(content, encoding="utf-8")
        print("  → 新しい日報ファイルを作成しました")

    print(f"\n✅ 完了: {nippou_path}")

    # AIアドバイス生成用にJSON出力
    result = {
        "date": date.strftime("%Y-%m-%d"),
        "weekday": WEEKDAY_JA[date.weekday()],
        "schedule": schedule_lines,
        "tasks": [t.replace("- [ ] ", "") for t in task_lines],
        "nippou_path": str(nippou_path),
    }
    print("\n--- DATA ---")
    print(json.dumps(result, ensure_ascii=False))
    return result


if __name__ == "__main__":
    main()
