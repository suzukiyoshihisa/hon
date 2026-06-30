#!/usr/bin/env python3
"""
Google カレンダー → ieyasu 日報 自動入力スクリプト

使い方:
  python3 gcal_to_ieyasu.py          # 今日の日報
  python3 gcal_to_ieyasu.py 20260510 # 指定日の日報

事前準備:
  pip install playwright google-auth-oauthlib google-auth-httplib2 google-api-python-client
  playwright install chromium

環境変数（.env ファイルまたは export で設定）:
  IEYASU_LOGIN_ID   : ieyasuのログインID（メールアドレス）
  IEYASU_PASSWORD   : ieyasuのパスワード
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from playwright.sync_api import sync_playwright

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
SCRIPTS_DIR = Path(__file__).resolve().parent
CREDS_FILE = SCRIPTS_DIR / "credentials.json"
TOKEN_FILE = SCRIPTS_DIR / "token.json"

JST = timezone(timedelta(hours=9))
WEEKDAY_JA = ["月", "火", "水", "木", "金", "土", "日"]

IEYASU_LOGIN_URL = "https://f.ieyasu.co/mid-kintai/login/"
IEYASU_DAILY_REPORTS_URL = "https://f.ieyasu.co/daily_reports"

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
            if not CREDS_FILE.exists():
                print(f"[エラー] credentials.json が見つかりません: {CREDS_FILE}")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("calendar", "v3", credentials=creds)


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


def build_schedule_text(events: list[dict]) -> str:
    """カレンダー予定を日報テキストに変換"""
    lines = []
    for e in events:
        start = e["start"]
        summary = e.get("summary", "(タイトルなし)")
        if "date" in start:
            lines.append(f"終日　{summary}")
        else:
            s = datetime.fromisoformat(start["dateTime"]).astimezone(JST)
            en = datetime.fromisoformat(e["end"]["dateTime"]).astimezone(JST)
            lines.append(f"{s:%H:%M}-{en:%H:%M}　{summary}")
    return "\n".join(lines) if lines else ""


def get_work_times(events: list[dict]) -> tuple[str, str, str]:
    """最初と最後のイベント時刻から出退勤時刻と業務時間を計算"""
    timed = [e for e in events if "dateTime" in e.get("start", {})]
    if not timed:
        return "", "", ""
    starts = [datetime.fromisoformat(e["start"]["dateTime"]).astimezone(JST) for e in timed]
    ends   = [datetime.fromisoformat(e["end"]["dateTime"]).astimezone(JST)   for e in timed]
    start_dt = starts[0]
    end_dt   = ends[-1]
    total_min = int(((end_dt - start_dt).total_seconds() / 60 - 60) * 1.5)
    h, m = divmod(total_min, 60)
    duration = f"{h:02d}:{m:02d}"
    return start_dt.strftime("%H:%M"), end_dt.strftime("%H:%M"), duration


# ─────────────────────────────────────────────
# ieyasu 操作
# ─────────────────────────────────────────────
def login_ieyasu(page):
    print("  ieyasu にログイン中...")
    page.goto(IEYASU_LOGIN_URL, wait_until="domcontentloaded")
    page.wait_for_selector("#user_login_id", state="visible", timeout=15000)
    page.fill("#user_login_id", os.environ["IEYASU_LOGIN_ID"])
    page.fill("#user_password", os.environ["IEYASU_PASSWORD"])
    page.click("button[type='submit'], input[type='submit'], button:has-text('ログイン')")
    page.wait_for_load_state("domcontentloaded")
    print("  ログイン完了")


def get_current_ym(page) -> tuple[int, int]:
    """ページに表示されている年月を取得（例: "2026年05月度" → (2026, 5)）"""
    import re
    text = page.locator("body").inner_text(timeout=5000)
    m = re.search(r"(\d{4})年(\d{2})月", text)
    if m:
        return int(m.group(1)), int(m.group(2))
    return (0, 0)


def navigate_to_date(page, date: datetime):
    """日報一覧の対象月に移動し、対象日の編集画面を開く"""
    target_year, target_month, target_day = date.year, date.month, date.day

    page.goto(IEYASU_DAILY_REPORTS_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(2000)

    if "login" in page.url:
        print("  [エラー] セッションが切れています。")
        sys.exit(1)

    # HTML をファイルに保存（セレクタ確認用）
    html_path = SCRIPTS_DIR / "ieyasu_debug.html"
    html_path.write_text(page.content(), encoding="utf-8")

    # selectドロップダウンで月を直接選択
    month_moved = False
    try:
        sel_el = page.locator("select").first
        if sel_el.is_visible(timeout=2000):
            options = sel_el.evaluate(
                "el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))"
            )
            for opt in options:
                if f"{target_year}年{target_month:02d}月" in opt["text"]:
                    sel_el.select_option(value=opt["value"])
                    page.wait_for_timeout(1500)
                    month_moved = True
                    print(f"  {target_year}年{target_month:02d}月に移動しました")
                    break
    except Exception:
        pass

    # selectで動かなかった場合: ボタンをnth(0)/nth(1)で試みる
    if not month_moved:
        for _ in range(24):
            cur_year, cur_month = get_current_ym(page)
            if (cur_year, cur_month) == (target_year, target_month):
                break
            if (cur_year, cur_month) > (target_year, target_month):
                page.locator("button").nth(0).click()
            else:
                page.locator("button").nth(1).click()
            page.wait_for_timeout(1000)

    print(f"  {target_year}年{target_month:02d}月を表示中")

    # 対象日の鉛筆アイコン（編集リンク）をクリック
    day_str = f"{target_day:02d}"
    edit_candidates = [
        f"tr:has-text('{day_str}') a[href*='edit']",
        f"tr:has-text('{day_str}') .edit-icon",
        f"tr:has-text('{day_str}') a",
        f"td:has-text('{day_str}') ~ td a",
        f"[data-date='{date.strftime('%Y-%m-%d')}'] a",
    ]
    clicked = False
    for sel in edit_candidates:
        try:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=1500):
                loc.click()
                page.wait_for_load_state("domcontentloaded")
                page.wait_for_timeout(1500)
                clicked = True
                print(f"  {target_month}/{target_day} の編集を開きました")
                break
        except Exception:
            continue

    if not clicked:
        print(f"  [警告] {target_month}/{target_day} の編集リンクが見つかりませんでした。")

    # スクリーンショット保存
    ss_path = SCRIPTS_DIR / f"ieyasu_{date.strftime('%Y%m%d')}.png"
    page.screenshot(path=str(ss_path))
    print(f"  スクリーンショット保存: {ss_path}")


def click_entry_form(page):
    """「新規作成」または「編集」ボタンをクリックしてフォームを開く"""
    # 編集ボタンが先にあれば編集、なければ新規作成
    for label in ["編集", "新規作成"]:
        try:
            loc = page.locator(f"button:has-text('{label}'), a:has-text('{label}')").first
            if loc.is_visible(timeout=2000):
                loc.click()
                page.wait_for_load_state("domcontentloaded")
                page.wait_for_timeout(1500)
                ss_path = SCRIPTS_DIR / "ieyasu_form.png"
                page.screenshot(path=str(ss_path))
                html_path = SCRIPTS_DIR / "ieyasu_form.html"
                html_path.write_text(page.content(), encoding="utf-8")
                print(f"  「{label}」フォームを開きました")
                return
        except Exception:
            continue
    raise Exception("「新規作成」「編集」ボタンが見つかりませんでした")


def fill_business_content(page, text: str) -> bool:
    """業務（短い名称）と備考（スケジュール一覧）を入力する"""
    # 備考テキストエリアにスケジュール全文を入力
    try:
        textarea = page.locator("textarea").first
        if textarea.is_visible(timeout=3000):
            textarea.fill(text)
            print("  備考にスケジュールを入力しました")
        else:
            print("  [警告] 備考（textarea）が見つかりませんでした")
            return False
    except Exception as e:
        print(f"  [警告] 備考の入力失敗: {e}")
        return False

    # 業務フィールド（短いテキスト入力）に「スケジュール」を入力
    try:
        task_input = page.locator("input[type='text']").first
        if task_input.is_visible(timeout=2000):
            task_input.fill("WEB,コンサル作業")
            print("  業務に「WEB,コンサル作業」を入力しました")
    except Exception:
        pass

    return True


def fill_work_times(page, work_start: str, work_end: str, duration: str):
    """業務時間（実績）に勤務時間を入力する"""
    if not duration:
        return

    # name="daily_report[reports_attributes][0][result_time_str]" を使う
    try:
        loc = page.locator("input[name*='result_time_str']").first
        loc.wait_for(state="visible", timeout=5000)
        loc.click(click_count=3)
        loc.fill(duration)
        loc.dispatch_event("change")
        loc.press("Escape")
        print(f"  業務時間を入力: {duration}（{work_start}〜{work_end}）")
        return
    except Exception as e:
        print(f"  [警告] 業務時間フィールドが見つかりませんでした（{duration}）: {e}")


def save_report(page) -> bool:
    """保存ボタンをクリック"""
    candidates = [
        "button:has-text('登録する')",
        "button:has-text('登録')",
        "button:has-text('保存')",
        "button:has-text('更新')",
        "button[type='submit']",
        "input[type='submit']",
    ]
    for sel in candidates:
        try:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=1500):
                loc.click()
                page.wait_for_load_state("domcontentloaded")
                print(f"  保存しました（セレクタ: {sel}）")
                return True
        except Exception:
            continue
    print("  [警告] 保存ボタンが見つかりませんでした。")
    return False


# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────
def main():
    # 認証情報チェック
    if not os.environ.get("IEYASU_LOGIN_ID") or not os.environ.get("IEYASU_PASSWORD"):
        print("[エラー] 環境変数が設定されていません。")
        print("  export IEYASU_LOGIN_ID='your_login_id'")
        print("  export IEYASU_PASSWORD='your_password'")
        sys.exit(1)

    # 対象日の決定
    if len(sys.argv) >= 2:
        try:
            date = datetime.strptime(sys.argv[1], "%Y%m%d").replace(tzinfo=JST)
        except ValueError:
            print("[エラー] 日付は YYYYMMDD 形式で指定してください（例: 20260510）")
            sys.exit(1)
    else:
        date = datetime.now(JST)

    weekday = WEEKDAY_JA[date.weekday()]
    print(f"対象日: {date.strftime('%Y-%m-%d')}（{weekday}）")

    # Google Calendar 取得
    print("\nGoogle カレンダーから予定を取得中...")
    service = get_calendar_service()
    events = get_events(service, date)

    if not events:
        print("  予定はありませんでした。")
    else:
        print(f"  {len(events)} 件の予定を取得しました。")

    schedule_text = build_schedule_text(events)
    work_start, work_end, duration = get_work_times(events)

    print(f"\n【入力内容】\n{schedule_text or '（なし）'}")
    if work_start:
        print(f"出勤: {work_start} / 退勤: {work_end} / 業務時間: {duration}")

    if not schedule_text:
        print("  予定がないためスキップします。")
        return

    # Playwright でieyasuに入力
    print("\nieyasu に書き込み中...")
    with sync_playwright() as p:
        headless = "--headless" in sys.argv
        browser = p.chromium.launch(headless=headless)
        page = browser.new_page()
        try:
            login_ieyasu(page)
            navigate_to_date(page, date)
            click_entry_form(page)
            fill_business_content(page, schedule_text)
            fill_work_times(page, work_start, work_end, duration)
            save_report(page)
            print(f"\n完了: {date.strftime('%Y-%m-%d')} の日報を入力しました。")
        except Exception as e:
            print(f"\n[エラー] {e}")
            page.screenshot(path=str(SCRIPTS_DIR / "ieyasu_error.png"))
            print("エラー時のスクリーンショット: scripts/ieyasu_error.png")
        finally:
            try:
                input("\nEnterキーでブラウザを閉じます...")
            except EOFError:
                pass
            browser.close()


if __name__ == "__main__":
    main()
