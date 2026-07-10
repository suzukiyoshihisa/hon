#!/usr/bin/env python3
"""
アナリティクス自動レポート生成スクリプト

使い方:
  python3 scripts/analytics_report.py                      # デフォルトサイト（sites.jsonの最初）、30日間
  python3 scripts/analytics_report.py --site example_site  # 指定サイト名
  python3 scripts/analytics_report.py --days 7             # 直近7日間
  python3 scripts/analytics_report.py --list               # 登録サイト一覧

初回実行時:
  ブラウザが開いてGoogleアカウントの認証が求められます。
  GA4とSearch ConsoleのAPIが有効になっていること、アカウントに権限があることを確認してください。

事前準備:
  1. Google Cloud Console で以下のAPIを有効化:
     - Google Analytics Data API
     - Google Search Console API
  2. scripts/analytics_sites.json にサイト情報を登録
"""

import sys
import os
import json
import re
import argparse
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, Dimension, Metric, DateRange, OrderBy, FilterExpression
)
from googleapiclient.discovery import build
import anthropic

# ─────────────────────────────────────────────
# 設定
# ─────────────────────────────────────────────
SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
]

BASE_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = Path(__file__).resolve().parent
CREDS_FILE = SCRIPTS_DIR / "credentials.json"
TOKEN_FILE = SCRIPTS_DIR / "analytics_token.json"
SITES_FILE = SCRIPTS_DIR / "analytics_sites.json"
OUTPUT_DIR = BASE_DIR / "04_プロジェクト管理" / "01_WEB事業" / "analytics"

JST = timezone(timedelta(hours=9))

# ─────────────────────────────────────────────
# 認証
# ─────────────────────────────────────────────
def get_credentials():
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
        print(f"[認証] トークンを保存しました: {TOKEN_FILE}")
    return creds

# ─────────────────────────────────────────────
# GA4 データ取得
# ─────────────────────────────────────────────
def fetch_ga4_data(creds, property_id: str, start_date: str, end_date: str) -> dict:
    client = BetaAnalyticsDataClient(credentials=creds)
    date_range = DateRange(start_date=start_date, end_date=end_date)

    # チャネル別セッション
    channel_report = client.run_report(RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[Dimension(name="sessionDefaultChannelGroup")],
        metrics=[
            Metric(name="sessions"),
            Metric(name="activeUsers"),
            Metric(name="engagementRate"),
        ],
        date_ranges=[date_range],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)],
        limit=10,
    ))

    # 全体KPI
    kpi_report = client.run_report(RunReportRequest(
        property=f"properties/{property_id}",
        metrics=[
            Metric(name="sessions"),
            Metric(name="activeUsers"),
            Metric(name="screenPageViews"),
            Metric(name="engagementRate"),
            Metric(name="averageSessionDuration"),
            Metric(name="newUsers"),
        ],
        date_ranges=[date_range],
    ))

    # 前期比（同じ期間分を過去に遡って比較）
    days = (datetime.strptime(end_date, "%Y-%m-%d") - datetime.strptime(start_date, "%Y-%m-%d")).days + 1
    prev_end = datetime.strptime(start_date, "%Y-%m-%d") - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days - 1)
    prev_range = DateRange(
        start_date=prev_start.strftime("%Y-%m-%d"),
        end_date=prev_end.strftime("%Y-%m-%d"),
    )

    kpi_prev = client.run_report(RunReportRequest(
        property=f"properties/{property_id}",
        metrics=[
            Metric(name="sessions"),
            Metric(name="activeUsers"),
            Metric(name="screenPageViews"),
            Metric(name="engagementRate"),
        ],
        date_ranges=[prev_range],
    ))

    # 人気ページ
    pages_report = client.run_report(RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[
            Dimension(name="pagePath"),
            Dimension(name="pageTitle"),
        ],
        metrics=[
            Metric(name="screenPageViews"),
            Metric(name="activeUsers"),
            Metric(name="averageSessionDuration"),
        ],
        date_ranges=[date_range],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)],
        limit=15,
    ))

    # デバイス別
    device_report = client.run_report(RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[Dimension(name="deviceCategory")],
        metrics=[Metric(name="sessions"), Metric(name="engagementRate")],
        date_ranges=[date_range],
    ))

    def row_to_dict(row, dim_names, metric_names):
        d = {}
        for i, name in enumerate(dim_names):
            d[name] = row.dimension_values[i].value
        for i, name in enumerate(metric_names):
            d[name] = row.metric_values[i].value
        return d

    kpi = {}
    if kpi_report.rows:
        row = kpi_report.rows[0]
        names = ["sessions", "activeUsers", "screenPageViews", "engagementRate", "averageSessionDuration", "newUsers"]
        for i, n in enumerate(names):
            kpi[n] = row.metric_values[i].value

    kpi_prev_vals = {}
    if kpi_prev.rows:
        row = kpi_prev.rows[0]
        names = ["sessions", "activeUsers", "screenPageViews", "engagementRate"]
        for i, n in enumerate(names):
            kpi_prev_vals[n] = row.metric_values[i].value

    channels = [
        row_to_dict(r, ["channel"], ["sessions", "activeUsers", "engagementRate"])
        for r in channel_report.rows
    ]
    pages = [
        row_to_dict(r, ["path", "title"], ["views", "users", "avgDuration"])
        for r in pages_report.rows
    ]
    devices = [
        row_to_dict(r, ["device"], ["sessions", "engagementRate"])
        for r in device_report.rows
    ]

    return {
        "kpi": kpi,
        "kpi_prev": kpi_prev_vals,
        "channels": channels,
        "pages": pages,
        "devices": devices,
    }

# ─────────────────────────────────────────────
# Search Console データ取得
# ─────────────────────────────────────────────
def fetch_search_console_data(creds, site_url: str, start_date: str, end_date: str) -> dict:
    service = build("searchconsole", "v1", credentials=creds)

    def query(dimensions, row_limit=20):
        body = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": dimensions,
            "rowLimit": row_limit,
        }
        try:
            result = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
            return result.get("rows", [])
        except Exception as e:
            print(f"  [警告] Search Console取得エラー ({dimensions}): {e}")
            return []

    query_rows = query(["query"], row_limit=20)
    page_rows = query(["page"], row_limit=20)
    device_rows = query(["device"])
    country_rows = query(["country"], row_limit=10)

    def parse_rows(rows, dim_key="keys"):
        result = []
        for r in rows:
            result.append({
                "keys": r.get("keys", []),
                "clicks": r.get("clicks", 0),
                "impressions": r.get("impressions", 0),
                "ctr": round(r.get("ctr", 0) * 100, 2),
                "position": round(r.get("position", 0), 1),
            })
        return result

    return {
        "queries": parse_rows(query_rows),
        "pages": parse_rows(page_rows),
        "devices": parse_rows(device_rows),
        "countries": parse_rows(country_rows),
    }

# ─────────────────────────────────────────────
# Claude 分析
# ─────────────────────────────────────────────
def analyze_with_claude(site_config: dict, ga4_data: dict, sc_data: dict, period_label: str) -> str:
    env = {}
    env_file = Path.home() / ".backlog.env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()

    api_key = env.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[エラー] ANTHROPIC_API_KEY が見つかりません")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    def fmt_pct_change(current, prev):
        try:
            c, p = float(current), float(prev)
            if p == 0:
                return "N/A"
            diff = (c - p) / p * 100
            sign = "+" if diff >= 0 else ""
            return f"{sign}{diff:.1f}%"
        except Exception:
            return "N/A"

    kpi = ga4_data["kpi"]
    prev = ga4_data["kpi_prev"]
    sessions_change = fmt_pct_change(kpi.get("sessions", 0), prev.get("sessions", 0))
    users_change = fmt_pct_change(kpi.get("activeUsers", 0), prev.get("activeUsers", 0))
    pv_change = fmt_pct_change(kpi.get("screenPageViews", 0), prev.get("screenPageViews", 0))

    top_queries = "\n".join([
        f"  - {r['keys'][0] if r['keys'] else '-'}: {r['clicks']}クリック / {r['impressions']}表示 / CTR{r['ctr']}% / 平均順位{r['position']}位"
        for r in sc_data["queries"][:10]
    ]) or "  （データなし）"

    top_pages_sc = "\n".join([
        f"  - {r['keys'][0] if r['keys'] else '-'}: {r['clicks']}クリック / {r['impressions']}表示 / CTR{r['ctr']}%"
        for r in sc_data["pages"][:10]
    ]) or "  （データなし）"

    top_pages_ga4 = "\n".join([
        f"  - {r['path']}: {r['views']}PV / {r['users']}ユーザー"
        for r in ga4_data["pages"][:10]
    ]) or "  （データなし）"

    channels_text = "\n".join([
        f"  - {r['channel']}: {r['sessions']}セッション / エンゲージメント率{float(r['engagementRate'])*100:.1f}%"
        for r in ga4_data["channels"]
    ]) or "  （データなし）"

    devices_text = "\n".join([
        f"  - {r['device']}: {r['sessions']}セッション / エンゲージメント率{float(r['engagementRate'])*100:.1f}%"
        for r in ga4_data["devices"]
    ]) or "  （データなし）"

    prompt = f"""あなたはWebマーケティングのエキスパートです。
以下のアナリティクスデータを分析し、指定のフォーマットで出力してください。

## サイト情報
- サイト名: {site_config.get('label', site_config.get('name'))}
- URL: {site_config.get('search_console_url', '')}
- 分析期間: {period_label}

## GA4 KPIサマリー（期間全体）
- セッション数: {int(float(kpi.get('sessions', 0))):,} （前期比: {sessions_change}）
- アクティブユーザー: {int(float(kpi.get('activeUsers', 0))):,} （前期比: {users_change}）
- ページビュー: {int(float(kpi.get('screenPageViews', 0))):,} （前期比: {pv_change}）
- 新規ユーザー: {int(float(kpi.get('newUsers', 0))):,}人
- エンゲージメント率: {float(kpi.get('engagementRate', 0))*100:.1f}%
- 平均セッション時間: {float(kpi.get('averageSessionDuration', 0)):.0f}秒

## 流入チャネル
{channels_text}

## デバイス別
{devices_text}

## 人気ページ（GA4）
{top_pages_ga4}

## Search Console トップクエリ
{top_queries}

## Search Console トップページ
{top_pages_sc}

---

以下のフォーマットで、各セクションを必ず記載してください。
各コメントは日本語で具体的な数値を引用しながら2〜4文で書いてください。

=== KPI_COMMENT ===
（このデータを見たときの率直な総評。「全体として良いのか悪いのか」「今月の一言」を2〜3文で。数字の羅列ではなく、見た印象・空気感を伝えること）

=== CHANNELS_COMMENT ===
（流入チャネルの全体像を見たときの総評。どこが頼りになっていて、どこが心配か。2〜3文）

=== DEVICES_COMMENT ===
（デバイス状況を見たときの総評。特に気になる点や安心できる点を2文程度で）

=== PAGES_COMMENT ===
（ページ閲覧状況を見たときの総評。サイトの使われ方の全体印象を2〜3文で）

=== SC_QUERIES_COMMENT ===
（検索クエリデータを見たときの総評。検索からどう見られているか、率直な印象を2〜3文で）

=== SC_PAGES_COMMENT ===
（検索流入ページを見たときの総評。どのページが検索で評価されているか、全体感を2〜3文で）

=== STRATEGIES ===
### SEO改善施策
（施策5〜8個、各データの根拠を示す）

### SNS・コンテンツ施策
（施策5〜8個）

### コンバージョン改善（CRO）施策
（施策5〜8個）

### 優先アクションプラン
**P1（今週中）**
- （具体的なアクション）

**P2（今月中）**
- （具体的なアクション）

**P3（来月以降）**
- （具体的なアクション）"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text

    def extract_section(text: str, key: str) -> str:
        pattern = rf"===\s*{key}\s*===\s*\n(.*?)(?===\s*\w|$)"
        m = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        return m.group(1).strip() if m else ""

    return {
        "kpi_comment":       extract_section(raw, "KPI_COMMENT"),
        "channels_comment":  extract_section(raw, "CHANNELS_COMMENT"),
        "devices_comment":   extract_section(raw, "DEVICES_COMMENT"),
        "pages_comment":     extract_section(raw, "PAGES_COMMENT"),
        "sc_queries_comment":extract_section(raw, "SC_QUERIES_COMMENT"),
        "sc_pages_comment":  extract_section(raw, "SC_PAGES_COMMENT"),
        "strategies":        extract_section(raw, "STRATEGIES"),
    }

# ─────────────────────────────────────────────
# Markdown レポート生成
# ─────────────────────────────────────────────
def build_markdown(site_config: dict, ga4_data: dict, sc_data: dict,
                   analysis: dict, start_date: str, end_date: str, today: str) -> str:
    kpi = ga4_data["kpi"]
    prev = ga4_data["kpi_prev"]

    def comment_block(text: str) -> list:
        if not text:
            return []
        return ["", f"> {text}", ""]

    def fmt_pct_change(current, prev_val):
        try:
            c, p = float(current), float(prev_val)
            if p == 0:
                return ""
            diff = (c - p) / p * 100
            sign = "+" if diff >= 0 else ""
            return f"（{sign}{diff:.1f}%）"
        except Exception:
            return ""

    label = site_config.get("label", site_config.get("name"))
    site_url = site_config.get("search_console_url", "")
    period = f"{start_date} 〜 {end_date}"

    lines = [
        f"# {label} アナリティクスレポート",
        f"",
        f"- **作成日**: {today}",
        f"- **分析期間**: {period}",
        f"- **サイトURL**: {site_url}",
        f"",
        f"---",
        f"",
        f"## 📊 KPIサマリー",
        f"",
        f"| 指標 | 値 | 前期比 |",
        f"|------|-----|--------|",
        f"| セッション | {int(float(kpi.get('sessions', 0))):,} | {fmt_pct_change(kpi.get('sessions', 0), prev.get('sessions', 0))} |",
        f"| アクティブユーザー | {int(float(kpi.get('activeUsers', 0))):,} | {fmt_pct_change(kpi.get('activeUsers', 0), prev.get('activeUsers', 0))} |",
        f"| ページビュー | {int(float(kpi.get('screenPageViews', 0))):,} | {fmt_pct_change(kpi.get('screenPageViews', 0), prev.get('screenPageViews', 0))} |",
        f"| 新規ユーザー | {int(float(kpi.get('newUsers', 0))):,} | - |",
        f"| エンゲージメント率 | {float(kpi.get('engagementRate', 0))*100:.1f}% | {fmt_pct_change(kpi.get('engagementRate', 0), prev.get('engagementRate', 0))} |",
        f"| 平均セッション時間 | {float(kpi.get('averageSessionDuration', 0)):.0f}秒 | - |",
        f"",
    ]
    lines += comment_block(analysis.get("kpi_comment", ""))

    # 流入チャネル
    lines += [
        "## 🌐 流入チャネル（GA4）",
        "",
        "| チャネル | セッション | エンゲージメント率 |",
        "|----------|-----------|-----------------|",
    ]
    for r in ga4_data["channels"]:
        eng = float(r.get("engagementRate", 0)) * 100
        lines.append(f"| {r['channel']} | {int(float(r['sessions'])):,} | {eng:.1f}% |")
    lines += comment_block(analysis.get("channels_comment", ""))

    # デバイス別
    lines += [
        "## 📱 デバイス別",
        "",
        "| デバイス | セッション | エンゲージメント率 |",
        "|---------|-----------|-----------------|",
    ]
    for r in ga4_data["devices"]:
        eng = float(r.get("engagementRate", 0)) * 100
        lines.append(f"| {r['device']} | {int(float(r['sessions'])):,} | {eng:.1f}% |")
    lines += comment_block(analysis.get("devices_comment", ""))

    # 人気ページ (GA4)
    lines += [
        "## 📄 人気ページ（GA4）",
        "",
        "| ページパス | PV | ユーザー数 | 平均滞在時間 |",
        "|-----------|-----|-----------|------------|",
    ]
    for r in ga4_data["pages"][:15]:
        lines.append(f"| {r['path']} | {int(float(r['views'])):,} | {int(float(r['users'])):,} | {float(r['avgDuration']):.0f}秒 |")
    lines += comment_block(analysis.get("pages_comment", ""))

    # Search Console クエリ
    lines += [
        "## 🔍 Search Console - トップクエリ",
        "",
        "| クエリ | クリック | 表示回数 | CTR | 平均順位 |",
        "|-------|---------|---------|-----|--------|",
    ]
    for r in sc_data["queries"][:20]:
        q = r["keys"][0] if r["keys"] else "-"
        lines.append(f"| {q} | {r['clicks']} | {r['impressions']} | {r['ctr']}% | {r['position']}位 |")
    lines += comment_block(analysis.get("sc_queries_comment", ""))

    # Search Console ページ
    lines += [
        "## 🔍 Search Console - トップページ",
        "",
        "| ページURL | クリック | 表示回数 | CTR | 平均順位 |",
        "|----------|---------|---------|-----|--------|",
    ]
    for r in sc_data["pages"][:15]:
        p = r["keys"][0] if r["keys"] else "-"
        lines.append(f"| {p} | {r['clicks']} | {r['impressions']} | {r['ctr']}% | {r['position']}位 |")
    lines += comment_block(analysis.get("sc_pages_comment", ""))

    # Claude 施策リスト
    lines += [
        "---",
        "",
        "## 🚀 マーケティング施策リスト",
        "",
        analysis.get("strategies", ""),
        "",
    ]

    return "\n".join(lines)

# ─────────────────────────────────────────────
# Backlog ドキュメント投稿
# ─────────────────────────────────────────────
BACKLOG_PROJECT_KEY = "WEB2023"
BACKLOG_PROJECT_ID  = 414278

def load_backlog_config() -> dict:
    env = {}
    env_file = Path.home() / ".backlog.env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

def backlog_api(path: str, method: str = "GET", params: dict = None, json_data: dict = None):
    config = load_backlog_config()
    api_key = config.get("BACKLOG_API_KEY", "")
    space   = config.get("BACKLOG_SPACE", "")
    base    = f"https://{space}/api/v2"
    p = dict(params or {})
    p["apiKey"] = api_key
    url = f"{base}{path}?{urllib.parse.urlencode(p, doseq=True)}"
    if json_data:
        body = json.dumps(json_data).encode("utf-8")
        req = urllib.request.Request(url, data=body, method=method)
        req.add_header("Content-Type", "application/json")
    else:
        req = urllib.request.Request(url, method=method)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())

def post_to_backlog(title: str, content: str, force: bool = False) -> dict:
    try:
        docs = backlog_api("/documents", params={
            "projectIdOrKey": BACKLOG_PROJECT_KEY,
            "offset": 0,
            "count": 100,
        })
        existing = next((d for d in docs if d.get("title") == title), None)
        if existing and not force:
            print(f"  📋 Backlog投稿済みのためスキップ: {title}")
            config = load_backlog_config()
            space = config.get("BACKLOG_SPACE", "")
            print(f"  🔗 https://{space}/document/{BACKLOG_PROJECT_KEY}/{existing['id']}/")
            return existing
        result = backlog_api("/documents", method="POST", json_data={
            "projectId": BACKLOG_PROJECT_ID,
            "title":     title,
            "content":   content,
        })
        print(f"  📋 Backlog作成: {title} (ID: {result['id']})")
        config = load_backlog_config()
        space = config.get("BACKLOG_SPACE", "")
        print(f"  🔗 https://{space}/document/{BACKLOG_PROJECT_KEY}/{result['id']}/")
        return result
    except Exception as e:
        print(f"  [警告] Backlog投稿失敗: {e}")
        return {}

# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="アナリティクスレポート自動生成")
    parser.add_argument("--site", help="サイト名（analytics_sites.json の name）")
    parser.add_argument("--days", type=int, default=30, help="分析日数（デフォルト: 30）")
    parser.add_argument("--list", action="store_true", help="登録サイト一覧を表示")
    parser.add_argument("--no-backlog", action="store_true", help="Backlogへの投稿をスキップ")
    parser.add_argument("--force-backlog", action="store_true", help="既存ドキュメントがあっても強制的に新規作成")
    args = parser.parse_args()

    # サイト設定読み込み
    if not SITES_FILE.exists():
        print(f"[エラー] {SITES_FILE} が見つかりません")
        sys.exit(1)
    sites_config = json.loads(SITES_FILE.read_text())
    sites = sites_config.get("sites", [])

    if args.list:
        print("登録サイト一覧:")
        for s in sites:
            print(f"  - {s['name']}: {s.get('label', '')} ({s.get('search_console_url', '')})")
        return

    if not sites:
        print("[エラー] analytics_sites.json にサイトが登録されていません")
        sys.exit(1)

    if args.site:
        site = next((s for s in sites if s["name"] == args.site), None)
        if not site:
            print(f"[エラー] サイト '{args.site}' が見つかりません")
            print(f"  登録済み: {[s['name'] for s in sites]}")
            sys.exit(1)
    else:
        site = sites[0]

    property_id = site.get("ga4_property_id", "")
    sc_url = site.get("search_console_url", "")

    if property_id == "XXXXXXXXX" or not property_id:
        print("[エラー] analytics_sites.json の ga4_property_id を設定してください")
        print("  GA4プロパティIDはGA4管理画面 > プロパティ設定 で確認できます（数字のみ）")
        sys.exit(1)

    today = datetime.now(JST)
    end_date = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    start_date = (today - timedelta(days=args.days)).strftime("%Y-%m-%d")
    period_label = f"{start_date} 〜 {end_date} （{args.days}日間）"

    print(f"📊 アナリティクスレポート生成開始")
    print(f"  サイト  : {site.get('label', site['name'])}")
    print(f"  期間    : {period_label}")

    # 認証
    print("🔑 Google認証中...")
    creds = get_credentials()

    # GA4
    print("📈 GA4データ取得中...")
    try:
        ga4_data = fetch_ga4_data(creds, property_id, start_date, end_date)
    except Exception as e:
        print(f"[エラー] GA4データ取得失敗: {e}")
        print("  → GA4プロパティIDが正しいか、Google Analytics Data APIが有効か確認してください")
        sys.exit(1)

    # Search Console
    print("🔍 Search Consoleデータ取得中...")
    sc_data = fetch_search_console_data(creds, sc_url, start_date, end_date)

    # Claude 分析
    print("🤖 Claude分析中...")
    analysis = analyze_with_claude(site, ga4_data, sc_data, period_label)

    # Markdown生成
    today_str = today.strftime("%Y-%m-%d")
    md_content = build_markdown(site, ga4_data, sc_data, analysis, start_date, end_date, today_str)

    # 出力
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = site["name"].replace(" ", "_").replace("/", "_")
    out_file = OUTPUT_DIR / f"{today.strftime('%Y%m%d')}_{safe_name}.md"
    out_file.write_text(md_content, encoding="utf-8")

    print(f"\n✅ レポート生成完了！")
    print(f"  📄 出力先: {out_file}")
    print(f"  📊 KPI: {int(float(ga4_data['kpi'].get('sessions', 0))):,}セッション / {int(float(ga4_data['kpi'].get('activeUsers', 0))):,}ユーザー")
    sc_total_clicks = sum(r["clicks"] for r in sc_data["queries"])
    print(f"  🔍 検索クリック: {sc_total_clicks:,}件 / トップクエリ: {len(sc_data['queries'])}件")

    # Backlog ドキュメント投稿
    if not args.no_backlog:
        label = site.get("label", site["name"])
        doc_title = f"{today.strftime('%Y%m%d')}_{label}_アナリティクスレポート"
        print(f"\n📋 Backlogに投稿中...")
        post_to_backlog(doc_title, md_content, force=args.force_backlog)


if __name__ == "__main__":
    main()
