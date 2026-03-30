#!/usr/bin/env python3
"""
岡崎食品 Amazon正規化提案書 → Google Slides 自動生成スクリプト

実行方法:
  python3 create_amazon_slides.py

初回実行時: ブラウザが開き、Googleアカウントのスコープ承認が必要
"""

import warnings
warnings.filterwarnings("ignore")

import json
import os
from pathlib import Path

os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# ─── 設定 ───────────────────────────────────────────────
SLIDES_TOKEN_FILE = Path.home() / ".slides_token.json"
CAL_TOKEN_FILE    = Path.home() / ".calendar_token.json"

SCOPES = [
    "https://www.googleapis.com/auth/presentations",
]

# カラーパレット
DARK_BLUE  = {"red": 0.051, "green": 0.122, "blue": 0.235}   # #0d1f3c
ORANGE     = {"red": 0.957, "green": 0.565, "blue": 0.047}   # #f4900c
WHITE      = {"red": 1.0,   "green": 1.0,   "blue": 1.0}
LIGHT_BG   = {"red": 1.0,   "green": 0.984, "blue": 0.961}   # #fffbf5
GRAY_BG    = {"red": 0.961, "green": 0.961, "blue": 0.961}   # #f5f5f5
DARK_TEXT  = {"red": 0.102, "green": 0.102, "blue": 0.102}   # #1a1a1a
GRAY_TEXT  = {"red": 0.533, "green": 0.533, "blue": 0.533}   # #888888


# ─── 認証 ─────────────────────────────────────────────────
def get_credentials():
    creds = None
    if SLIDES_TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(SLIDES_TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # 既存カレンダートークンの client_id / client_secret を流用
            cal = json.loads(CAL_TOKEN_FILE.read_text())
            client_config = {
                "installed": {
                    "client_id": cal["client_id"],
                    "client_secret": cal["client_secret"],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
                }
            }
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
            creds = flow.run_local_server(port=0)

        SLIDES_TOKEN_FILE.write_text(creds.to_json())
        print(f"✅ トークン保存: {SLIDES_TOKEN_FILE}")

    return creds


# ─── ユーティリティ ──────────────────────────────────────
def pt(val): return {"magnitude": val, "unit": "PT"}
def emu(px): return int(px * 9144)   # px → EMU (96dpi想定)

def mk_rect(l, t, w, h):
    """EMU単位のboundingBox辞書を返す"""
    return {
        "left":   {"magnitude": l, "unit": "EMU"},
        "top":    {"magnitude": t, "unit": "EMU"},
        "width":  {"magnitude": w, "unit": "EMU"},
        "height": {"magnitude": h, "unit": "EMU"},
    }

def solid_fill(color):
    return {"solidFill": {"color": {"rgbColor": color}}}

def text_style(bold=False, size=12, color=None, italic=False):
    s = {
        "bold": bold,
        "fontSize": pt(size),
        "italic": italic,
    }
    if color:
        s["foregroundColor"] = {"opaqueColor": {"rgbColor": color}}
    return s


# ─── スライド生成ヘルパー ────────────────────────────────
class SlideBuilder:
    def __init__(self, service, presentation_id):
        self.service = service
        self.pid = presentation_id
        self.requests = []
        self._obj_counter = 1000

    def new_id(self, prefix="obj"):
        self._obj_counter += 1
        return f"{prefix}_{self._obj_counter}"

    def flush(self):
        if self.requests:
            self.service.presentations().batchUpdate(
                presentationId=self.pid,
                body={"requests": self.requests}
            ).execute()
            self.requests = []

    def add_slide(self, layout="BLANK"):
        sid = self.new_id("slide")
        self.requests.append({
            "createSlide": {
                "objectId": sid,
                "slideLayoutReference": {"predefinedLayout": layout},
            }
        })
        return sid

    def delete_placeholder(self, slide_id):
        """ブランクスライドのプレースホルダーを削除"""
        pass  # BLANKレイアウトなら不要

    def add_shape(self, slide_id, shape_type, rect, fill_color=None, obj_id=None):
        oid = obj_id or self.new_id("shape")
        req = {
            "createShape": {
                "objectId": oid,
                "shapeType": shape_type,
                "elementProperties": {
                    "pageObjectId": slide_id,
                    "size": {
                        "width":  rect["width"],
                        "height": rect["height"],
                    },
                    "transform": {
                        "scaleX": 1, "scaleY": 1,
                        "translateX": rect["left"]["magnitude"],
                        "translateY": rect["top"]["magnitude"],
                        "unit": "EMU",
                    },
                },
            }
        }
        self.requests.append(req)
        if fill_color:
            self.requests.append({
                "updateShapeProperties": {
                    "objectId": oid,
                    "shapeProperties": {
                        "shapeBackgroundFill": solid_fill(fill_color),
                        "outline": {"outlineFill": {"solidFill": {"color": {"rgbColor": fill_color}}}}
                    },
                    "fields": "shapeBackgroundFill,outline",
                }
            })
        return oid

    # alignment 変換マップ (Google Slides API の列挙値)
    _ALIGN_MAP = {"LEFT": "START", "RIGHT": "END", "CENTER": "CENTER", "JUSTIFIED": "JUSTIFIED",
                  "START": "START", "END": "END"}

    def add_textbox(self, slide_id, text, rect, bold=False, size=12, color=None,
                     align="LEFT", valign="MIDDLE", fill_color=None, obj_id=None,
                     italic=False, word_wrap=True):
        oid = obj_id or self.new_id("tb")
        api_align = self._ALIGN_MAP.get(align, "START")
        self.requests.append({
            "createShape": {
                "objectId": oid,
                "shapeType": "TEXT_BOX",
                "elementProperties": {
                    "pageObjectId": slide_id,
                    "size": {"width": rect["width"], "height": rect["height"]},
                    "transform": {
                        "scaleX": 1, "scaleY": 1,
                        "translateX": rect["left"]["magnitude"],
                        "translateY": rect["top"]["magnitude"],
                        "unit": "EMU",
                    },
                },
            }
        })
        if fill_color:
            self.requests.append({
                "updateShapeProperties": {
                    "objectId": oid,
                    "shapeProperties": {
                        "shapeBackgroundFill": solid_fill(fill_color),
                        "outline": {"outlineFill": {"solidFill": {"color": {"rgbColor": fill_color}}}},
                    },
                    "fields": "shapeBackgroundFill,outline",
                }
            })
        self.requests.append({
            "insertText": {"objectId": oid, "text": text, "insertionIndex": 0}
        })
        style = text_style(bold=bold, size=size, color=color or DARK_TEXT, italic=italic)
        self.requests.append({
            "updateTextStyle": {
                "objectId": oid,
                "style": style,
                "fields": ",".join(style.keys()),
            }
        })
        self.requests.append({
            "updateParagraphStyle": {
                "objectId": oid,
                "style": {
                    "alignment": api_align,
                    "spaceAbove": pt(0),
                    "spaceBelow": pt(0),
                },
                "fields": "alignment,spaceAbove,spaceBelow",
            }
        })
        # 縦方向
        self.requests.append({
            "updateShapeProperties": {
                "objectId": oid,
                "shapeProperties": {"contentAlignment": valign},
                "fields": "contentAlignment",
            }
        })
        return oid

    def add_table(self, slide_id, rows, cols, rect, obj_id=None):
        oid = obj_id or self.new_id("table")
        self.requests.append({
            "createTable": {
                "objectId": oid,
                "elementProperties": {
                    "pageObjectId": slide_id,
                    "size": {"width": rect["width"], "height": rect["height"]},
                    "transform": {
                        "scaleX": 1, "scaleY": 1,
                        "translateX": rect["left"]["magnitude"],
                        "translateY": rect["top"]["magnitude"],
                        "unit": "EMU",
                    },
                },
                "rows": rows,
                "columns": cols,
            }
        })
        return oid

    def set_table_cell(self, table_id, row, col, text, bold=False, size=10,
                        color=None, bg_color=None, align="LEFT"):
        api_align = self._ALIGN_MAP.get(align, "START")
        if text:
            self.requests.append({
                "insertText": {
                    "objectId": table_id,
                    "cellLocation": {"rowIndex": row, "columnIndex": col},
                    "text": text,
                    "insertionIndex": 0,
                }
            })
            style = text_style(bold=bold, size=size, color=color or DARK_TEXT)
            self.requests.append({
                "updateTextStyle": {
                    "objectId": table_id,
                    "cellLocation": {"rowIndex": row, "columnIndex": col},
                    "style": style,
                    "fields": ",".join(style.keys()),
                }
            })
            self.requests.append({
                "updateParagraphStyle": {
                    "objectId": table_id,
                    "cellLocation": {"rowIndex": row, "columnIndex": col},
                    "style": {"alignment": api_align},
                    "fields": "alignment",
                }
            })
        if bg_color:
            self.requests.append({
                "updateTableCellProperties": {
                    "objectId": table_id,
                    "tableRange": {
                        "location": {"rowIndex": row, "columnIndex": col},
                        "rowSpan": 1,
                        "columnSpan": 1,
                    },
                    "tableCellProperties": {
                        "tableCellBackgroundFill": solid_fill(bg_color),
                    },
                    "fields": "tableCellBackgroundFill",
                }
            })

    def add_accent_bar(self, slide_id, top_emu, height=emu(4)):
        """オレンジのアクセントバーを追加"""
        W = emu(960)
        oid = self.new_id("bar")
        self.requests.append({
            "createShape": {
                "objectId": oid,
                "shapeType": "RECTANGLE",
                "elementProperties": {
                    "pageObjectId": slide_id,
                    "size": {"width": {"magnitude": W, "unit": "EMU"}, "height": {"magnitude": height, "unit": "EMU"}},
                    "transform": {
                        "scaleX": 1, "scaleY": 1,
                        "translateX": 0, "translateY": top_emu, "unit": "EMU",
                    },
                },
            }
        })
        self.requests.append({
            "updateShapeProperties": {
                "objectId": oid,
                "shapeProperties": {
                    "shapeBackgroundFill": solid_fill(ORANGE),
                    "outline": {"outlineFill": {"solidFill": {"color": {"rgbColor": ORANGE}}}},
                },
                "fields": "shapeBackgroundFill,outline",
            }
        })
        return oid

    def add_header(self, slide_id, title, subtitle=""):
        """共通ヘッダー: 紺背景 + タイトル + 右のサブタイトル"""
        W = emu(960)
        H = emu(60)
        # 背景
        bg_id = self.new_id("hdr_bg")
        self.requests.append({
            "createShape": {
                "objectId": bg_id,
                "shapeType": "RECTANGLE",
                "elementProperties": {
                    "pageObjectId": slide_id,
                    "size": {"width": {"magnitude": W, "unit": "EMU"}, "height": {"magnitude": H, "unit": "EMU"}},
                    "transform": {"scaleX": 1, "scaleY": 1, "translateX": 0, "translateY": 0, "unit": "EMU"},
                },
            }
        })
        self.requests.append({
            "updateShapeProperties": {
                "objectId": bg_id,
                "shapeProperties": {
                    "shapeBackgroundFill": solid_fill(DARK_BLUE),
                    "outline": {"outlineFill": {"solidFill": {"color": {"rgbColor": DARK_BLUE}}}},
                },
                "fields": "shapeBackgroundFill,outline",
            }
        })
        # タイトルテキスト
        self.add_textbox(slide_id, title,
                          mk_rect(emu(30), emu(12), emu(700), emu(40)),
                          bold=True, size=16, color=WHITE, valign="MIDDLE")
        if subtitle:
            self.add_textbox(slide_id, subtitle,
                              mk_rect(emu(740), emu(12), emu(200), emu(40)),
                              bold=False, size=9, color={"red": 0.8, "green": 0.8, "blue": 0.8},
                              align="RIGHT", valign="MIDDLE")
        # アクセントバー
        self.add_accent_bar(slide_id, H)
        return H + emu(4)   # 本文開始Y位置を返す


# ─── 各スライド生成関数 ────────────────────────────────────

def build_cover(sb, slide_id):
    W = emu(960)
    # 背景を薄いオレンジグラデ風に（薄い色で統一）
    sb.add_shape(slide_id, "RECTANGLE",
                  mk_rect(0, 0, W, emu(540)),
                  fill_color={"red": 1.0, "green": 0.996, "blue": 0.988})
    # ヘッダー
    sb.add_header(slide_id, "Amazon 正規化 & EC強化 提案書", "有限会社 岡崎 御中 ｜ 2026年3月")

    # タグ
    sb.add_textbox(slide_id, "EC CONSULTING PROPOSAL",
                    mk_rect(emu(40), emu(100), emu(280), emu(26)),
                    bold=True, size=9, color=ORANGE,
                    fill_color={"red": 1.0, "green": 0.949, "blue": 0.878})

    # メインタイトル
    sb.add_textbox(slide_id, "Amazon 正規店舗の立ち上げと\nブランド保護のご提案",
                    mk_rect(emu(40), emu(138), emu(580), emu(110)),
                    bold=True, size=24, color=DARK_BLUE, valign="TOP")

    # サブテキスト
    sb.add_textbox(slide_id,
                    "現在Amazonに流通している岡崎食品商品は、第三者による無断出品が確認されています。\n"
                    "正規セラーアカウントを開設し、ブランドを守り、正規ルートでの売上を確立します。",
                    mk_rect(emu(40), emu(260), emu(560), emu(70)),
                    bold=False, size=11, color={"red": 0.3, "green": 0.3, "blue": 0.3}, valign="TOP")

    # メタ情報
    sb.add_textbox(slide_id, "提案元：株式会社 HON　担当：鈴木　｜　提案日：2026年3月30日",
                    mk_rect(emu(40), emu(470), emu(500), emu(30)),
                    bold=False, size=9, color=GRAY_TEXT)

    # 右側デコボックス
    for i, (num, label) in enumerate([("6", "無断出品ASIN\n確認済み"), ("3", "フェーズ構成")]):
        top = emu(160) + i * emu(120)
        sb.add_shape(slide_id, "RECTANGLE",
                      mk_rect(emu(720), top, emu(180), emu(100)),
                      fill_color={"red": 1.0, "green": 0.973, "blue": 0.941})
        sb.add_textbox(slide_id, num,
                        mk_rect(emu(720), top + emu(10), emu(180), emu(50)),
                        bold=True, size=36, color=ORANGE, align="CENTER")
        sb.add_textbox(slide_id, label,
                        mk_rect(emu(720), top + emu(58), emu(180), emu(36)),
                        bold=False, size=9, color=GRAY_TEXT, align="CENTER")


def build_problems(sb, slide_id):
    body_top = sb.add_header(slide_id, "現状の問題 — 無断出品がブランドを傷つけています", "CURRENT SITUATION")

    # リード文
    sb.add_textbox(slide_id,
                    "有限会社岡崎には現在 Amazon正規セラーアカウントが存在しません。\n"
                    "岡崎食品の商品名・商品写真を使った第三者出品が複数確認されており、対応が急務です。",
                    mk_rect(emu(30), body_top + emu(10), emu(900), emu(50)),
                    bold=False, size=10, color=DARK_TEXT, valign="TOP",
                    fill_color={"red": 1.0, "green": 0.953, "blue": 0.886})

    # 3枚カード
    cards = [
        ("⚠ 品質・ブランドイメージの毀損",
         "第三者が販売する商品の品質・鮮度・梱包を岡崎食品は管理できません。\n粗悪品・模倣品が岡崎食品の名義で流通するリスクがあります。"),
        ("🔍 正規ルートで買えない状態",
         "消費者がAmazonで「岡崎食品」を検索しても正規ページが存在しないため、\n無断出品ページへ流れてしまいます。売上・口コミが第三者に蓄積されます。"),
        ("💬 レビュー・価格が管理不能",
         "価格の不当な吊り上げ・誤情報による低評価レビューが蓄積されるリスクがあります。\n一度ついた悪評は後から消すことが困難です。"),
    ]
    card_w = emu(290)
    card_h = emu(240)
    for i, (title, body) in enumerate(cards):
        left = emu(30) + i * (card_w + emu(20))
        top = body_top + emu(72)
        sb.add_shape(slide_id, "RECTANGLE",
                      mk_rect(left, top, card_w, card_h),
                      fill_color={"red": 1.0, "green": 0.980, "blue": 0.961})
        sb.add_textbox(slide_id, title,
                        mk_rect(left + emu(12), top + emu(12), card_w - emu(24), emu(36)),
                        bold=True, size=11, color={"red": 0.78, "green": 0.31, "blue": 0.0}, valign="TOP")
        sb.add_textbox(slide_id, body,
                        mk_rect(left + emu(12), top + emu(52), card_w - emu(24), card_h - emu(64)),
                        bold=False, size=9, color=DARK_TEXT, valign="TOP")


def build_asin_list(sb, slide_id):
    body_top = sb.add_header(slide_id, "無断出品の現状 — 確認済み6件", "UNAUTHORIZED LISTINGS")

    # テーブル
    tid = sb.add_table(slide_id, 7, 5,
                        mk_rect(emu(20), body_top + emu(20), emu(920), emu(380)))
    sb.flush()

    headers = ["#", "商品名", "ASIN", "出品者", "状態"]
    rows = [
        ("1", "納豆麹漬 180g × 4袋", "B08CSJ9HXL", "食いしん坊侍 公式ストア", "無断出品確認"),
        ("2", "納豆麹漬 180g × 3袋", "B08CSKBRVC", "—", "出品者要確認"),
        ("3", "納豆麹漬 国産ネギ 160g × 3袋", "B0DP25F8J9", "—", "出品者要確認"),
        ("4", "納豆麹漬け 5種類 チューブ", "B0C12T6MJ5", "—", "出品者要確認"),
        ("5", "食べるラー油と柿の種 160g", "B082PCVZD6", "ありがとう365", "ノーブランド名義"),
        ("6", "岡崎 無糖発酵あんバター 150g", "B0BKL89MZG", "—", "出品者要確認"),
    ]
    for ci, h in enumerate(headers):
        sb.set_table_cell(tid, 0, ci, h, bold=True, size=10, color=WHITE, bg_color=DARK_BLUE, align="CENTER")
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            bg = {"red": 0.98, "green": 0.98, "blue": 0.98} if ri % 2 == 1 else WHITE
            if ci == 4:
                col = {"red": 0.78, "green": 0.31, "blue": 0.0}
            else:
                col = DARK_TEXT
            sb.set_table_cell(tid, ri + 1, ci, val, bold=(ci == 4), size=9, color=col, bg_color=bg,
                               align="CENTER" if ci in [0, 4] else "LEFT")

    sb.add_textbox(slide_id,
                    "※ 出品者「要確認」は検索結果から特定できなかったもの。ブランドレジストリ取得後に削除申請を行います。",
                    mk_rect(emu(20), body_top + emu(412), emu(920), emu(24)),
                    bold=False, size=8, color=GRAY_TEXT, valign="TOP")


def build_overview(sb, slide_id):
    body_top = sb.add_header(slide_id, "提案の全体像 — 3フェーズで正規化から成長へ", "PROPOSAL OVERVIEW")

    phases = [
        ("Phase 1", "基盤整備", "1〜2ヶ月目",
         ["Amazonセラーアカウント開設", "正規商品ページ作成", "ブランドレジストリ申請", "競合・現状分析"]),
        ("Phase 2", "正規化・信頼構築", "2〜4ヶ月目",
         ["無断出品ページへの削除申請", "Amazon広告（スポンサー）開始", "レビュー獲得施策", "ページ改善（CTR/CVR）"]),
        ("Phase 3", "成長・拡大", "5ヶ月目〜",
         ["広告予算最適化", "新商品追加出品", "楽天・自社ECとの連携", "中長期ロードマップ更新"]),
    ]
    box_w = emu(280)
    box_h = emu(260)
    arrow_left = [emu(30), emu(340), emu(650)]
    for i, (ph, title, period, items) in enumerate(phases):
        left = emu(30) + i * (box_w + emu(30))
        top = body_top + emu(20)
        fill = LIGHT_BG if i == 0 else WHITE
        sb.add_shape(slide_id, "RECTANGLE", mk_rect(left, top, box_w, box_h), fill_color=fill)
        sb.add_textbox(slide_id, ph, mk_rect(left + emu(10), top + emu(8), box_w - emu(20), emu(20)),
                        bold=True, size=9, color=ORANGE)
        sb.add_textbox(slide_id, title, mk_rect(left + emu(10), top + emu(30), box_w - emu(20), emu(26)),
                        bold=True, size=13, color=DARK_BLUE, valign="TOP")
        sb.add_textbox(slide_id, period, mk_rect(left + emu(10), top + emu(58), box_w - emu(20), emu(18)),
                        bold=False, size=9, color=GRAY_TEXT)
        bullet_text = "\n".join(f"▸ {it}" for it in items)
        sb.add_textbox(slide_id, bullet_text,
                        mk_rect(left + emu(10), top + emu(82), box_w - emu(20), box_h - emu(94)),
                        bold=False, size=9, color=DARK_TEXT, valign="TOP")
        # 矢印
        if i < 2:
            sb.add_textbox(slide_id, "▶",
                            mk_rect(left + box_w + emu(8), top + emu(110), emu(20), emu(30)),
                            bold=True, size=14, color=ORANGE, align="CENTER")

    # ゴール3チップ
    goals = ["正規ページでブランドを守る", "無断出品を排除する", "Amazon売上 月20万円〜"]
    chip_w = emu(290)
    for i, g in enumerate(goals):
        left = emu(30) + i * (chip_w + emu(20))
        top = body_top + emu(298)
        sb.add_shape(slide_id, "RECTANGLE",
                      mk_rect(left, top, chip_w, emu(50)), fill_color=DARK_BLUE)
        sb.add_textbox(slide_id, g,
                        mk_rect(left + emu(8), top, chip_w - emu(16), emu(50)),
                        bold=True, size=10, color=WHITE, align="CENTER")


def build_phase_detail(sb, slide_id, phase_num, title, period, ec_items, consul_items, kpis):
    body_top = sb.add_header(slide_id, f"Phase {phase_num} 詳細 — {title}", f"PHASE {phase_num} DETAIL")

    # フェーズバッジ
    sb.add_shape(slide_id, "ROUND_RECTANGLE",
                  mk_rect(emu(30), body_top + emu(10), emu(90), emu(22)),
                  fill_color=ORANGE)
    sb.add_textbox(slide_id, f"Phase {phase_num}",
                    mk_rect(emu(30), body_top + emu(10), emu(90), emu(22)),
                    bold=True, size=9, color=WHITE, align="CENTER")
    sb.add_shape(slide_id, "ROUND_RECTANGLE",
                  mk_rect(emu(128), body_top + emu(10), emu(110), emu(22)),
                  fill_color=DARK_BLUE)
    sb.add_textbox(slide_id, period,
                    mk_rect(emu(128), body_top + emu(10), emu(110), emu(22)),
                    bold=False, size=9, color=WHITE, align="CENTER")

    col_w = emu(440)
    col_top = body_top + emu(42)

    # 左列: EC実務
    sb.add_textbox(slide_id, "EC 実務（HONが代行）",
                    mk_rect(emu(30), col_top, col_w, emu(20)),
                    bold=True, size=9, color=ORANGE)
    sb.add_shape(slide_id, "RECTANGLE",
                  mk_rect(emu(30), col_top + emu(22), col_w, emu(2)),
                  fill_color={"red": 1.0, "green": 0.867, "blue": 0.627})
    ec_text = "\n".join(f"● {it}" for it in ec_items)
    sb.add_textbox(slide_id, ec_text,
                    mk_rect(emu(30), col_top + emu(28), col_w, emu(170)),
                    bold=False, size=9, color=DARK_TEXT, valign="TOP")

    # 右列: コンサル
    sb.add_textbox(slide_id, "コンサルティング（改善提案）",
                    mk_rect(emu(490), col_top, col_w, emu(20)),
                    bold=True, size=9, color=ORANGE)
    sb.add_shape(slide_id, "RECTANGLE",
                  mk_rect(emu(490), col_top + emu(22), col_w, emu(2)),
                  fill_color={"red": 1.0, "green": 0.867, "blue": 0.627})
    cons_text = "\n".join(f"● {it}" for it in consul_items)
    sb.add_textbox(slide_id, cons_text,
                    mk_rect(emu(490), col_top + emu(28), col_w, emu(170)),
                    bold=False, size=9, color=DARK_TEXT, valign="TOP")

    # KPIチップ
    chip_w = (emu(920) - emu(30) * 3) // 4
    for i, (label, val, arrow) in enumerate(kpis):
        left = emu(30) + i * (chip_w + emu(14))
        top = body_top + emu(270)
        sb.add_shape(slide_id, "RECTANGLE",
                      mk_rect(left, top, chip_w, emu(80)),
                      fill_color=LIGHT_BG)
        sb.add_textbox(slide_id, label,
                        mk_rect(left + emu(4), top + emu(6), chip_w - emu(8), emu(26)),
                        bold=False, size=8, color=GRAY_TEXT, align="CENTER")
        sb.add_textbox(slide_id, val,
                        mk_rect(left + emu(4), top + emu(30), chip_w - emu(8), emu(26)),
                        bold=True, size=13, color=DARK_BLUE, align="CENTER")
        sb.add_textbox(slide_id, arrow,
                        mk_rect(left + emu(4), top + emu(58), chip_w - emu(8), emu(18)),
                        bold=False, size=8, color=ORANGE, align="CENTER")


def build_schedule(sb, slide_id):
    body_top = sb.add_header(slide_id, "推進スケジュール", "PROJECT SCHEDULE")

    rows_data = [
        ("", "1ヶ月目", "2ヶ月目", "3ヶ月目", "4ヶ月目", "5ヶ月目", "6ヶ月目〜"),
        ("セラーアカウント開設",     "実施",    "—",        "—",    "—",    "—",    "—"),
        ("正規商品ページ作成",       "主力3品",  "全品拡大",  "—",    "—",    "—",    "—"),
        ("ブランドレジストリ申請",   "申請",    "審査中",    "承認", "—",    "—",    "—"),
        ("無断出品 削除申請",        "—",       "申請開始",  "順次対応", "完全排除", "—", "—"),
        ("Amazon広告運用",           "—",       "—",        "開始", "継続", "継続",  "継続"),
        ("楽天市場 出店",            "—",       "—",        "—",    "—",   "申請作成", "稼働"),
    ]
    tid = sb.add_table(slide_id, len(rows_data), 7,
                        mk_rect(emu(20), body_top + emu(20), emu(920), emu(370)))
    sb.flush()

    ACTIVE = {"red": 0.957, "green": 0.565, "blue": 0.047}
    PARTIAL = {"red": 1.0, "green": 0.851, "blue": 0.604}
    ONGOING = {"red": 0.051, "green": 0.122, "blue": 0.235}
    EMPTY = {"red": 0.961, "green": 0.961, "blue": 0.961}

    active_map = {
        (1,1): ACTIVE, (2,1): ACTIVE, (2,2): PARTIAL,
        (3,1): ACTIVE, (3,2): PARTIAL, (3,3): ACTIVE,
        (4,2): ACTIVE, (4,3): PARTIAL, (4,4): ACTIVE,
        (5,3): ACTIVE, (5,4): ONGOING, (5,5): ONGOING, (5,6): ONGOING,
        (6,5): ACTIVE, (6,6): ONGOING,
    }

    for ri, row in enumerate(rows_data):
        for ci, val in enumerate(row):
            if ri == 0:
                bg = DARK_BLUE if ci > 0 else {"red": 0.94, "green": 0.94, "blue": 0.94}
                col = WHITE if ci > 0 else DARK_TEXT
                sb.set_table_cell(tid, ri, ci, val, bold=True, size=9, color=col,
                                   bg_color=bg, align="CENTER")
            else:
                if ci == 0:
                    sb.set_table_cell(tid, ri, ci, val, bold=True, size=8,
                                       color=DARK_TEXT, bg_color=WHITE, align="LEFT")
                else:
                    bg = active_map.get((ri, ci), EMPTY)
                    col = WHITE if bg in [ACTIVE, ONGOING] else DARK_TEXT
                    b = bg in [ACTIVE, ONGOING]
                    sb.set_table_cell(tid, ri, ci, val, bold=b, size=8, color=col,
                                       bg_color=bg, align="CENTER")


def build_kpi(sb, slide_id):
    body_top = sb.add_header(slide_id, "KPI目標 — 数値で管理し、成果を可視化します", "KPI & TARGETS")

    kpi_rows = [
        ("指標", "Phase 1 目標（1〜2ヶ月）", "Phase 2 目標（2〜4ヶ月）", "Phase 3 目標（5ヶ月〜）"),
        ("正規ページ 出品数", "主力3商品", "全商品", "新商品追加"),
        ("月間売上（Amazon）", "立ち上げ", "5万円〜", "20万円〜"),
        ("レビュー件数（各商品）", "獲得開始", "10件〜", "30件〜"),
        ("無断出品の排除", "棚卸し完了", "主要品 削除申請済み", "完全排除"),
        ("Amazon広告 ACoS", "—", "30%以下", "20%以下"),
        ("楽天市場 出店", "—", "—", "稼働開始"),
    ]
    tid = sb.add_table(slide_id, len(kpi_rows), 4,
                        mk_rect(emu(20), body_top + emu(20), emu(920), emu(390)))
    sb.flush()

    for ri, row in enumerate(kpi_rows):
        for ci, val in enumerate(row):
            if ri == 0:
                sb.set_table_cell(tid, ri, ci, val, bold=True, size=9,
                                   color=WHITE, bg_color=DARK_BLUE, align="CENTER" if ci > 0 else "LEFT")
            else:
                bg = {"red": 0.98, "green": 0.98, "blue": 0.98} if ri % 2 == 1 else WHITE
                col = ORANGE if ci == 3 else DARK_TEXT
                b = ci == 3
                sb.set_table_cell(tid, ri, ci, val, bold=b, size=9, color=col,
                                   bg_color=bg, align="CENTER" if ci > 0 else "LEFT")

    sb.add_textbox(slide_id,
                    "※ KPIは月次MTGで実績をもとに随時見直します。広告費・競合状況により目標値は変動する場合があります。",
                    mk_rect(emu(20), body_top + emu(422), emu(920), emu(22)),
                    bold=False, size=8, color=GRAY_TEXT, valign="TOP")


def build_cost(sb, slide_id):
    body_top = sb.add_header(slide_id, "費用・支援体制", "FEE & TEAM STRUCTURE")

    # 費用ブロック
    sb.add_shape(slide_id, "RECTANGLE",
                  mk_rect(emu(20), body_top + emu(10), emu(920), emu(100)),
                  fill_color=DARK_BLUE)
    sb.add_textbox(slide_id, "月額 運用代行費用（岡崎食品コンサルティング全体）",
                    mk_rect(emu(36), body_top + emu(16), emu(400), emu(20)),
                    bold=False, size=9, color={"red": 0.7, "green": 0.7, "blue": 0.7})
    sb.add_textbox(slide_id, "¥190,000 / 月（税別）",
                    mk_rect(emu(36), body_top + emu(38), emu(300), emu(40)),
                    bold=True, size=22, color={"red": 1.0, "green": 0.820, "blue": 0.400})
    sb.add_textbox(slide_id, "Amazon EC運用代行・コンサルティング・月次MTG・レポート作成を含む",
                    mk_rect(emu(36), body_top + emu(82), emu(500), emu(18)),
                    bold=False, size=8, color={"red": 0.6, "green": 0.6, "blue": 0.6})
    include_text = "✓ Amazonアカウント開設・商品ページ作成  ✓ ブランドレジストリ申請・無断出品対応\n✓ 広告運用（スポンサープロダクト）  ✓ 月次レポート＋コンサルMTG（月1回）"
    sb.add_textbox(slide_id, include_text,
                    mk_rect(emu(540), body_top + emu(18), emu(390), emu(60)),
                    bold=False, size=9, color={"red": 0.9, "green": 0.9, "blue": 0.9}, valign="TOP")

    # 体制
    sb.add_textbox(slide_id, "支援体制",
                    mk_rect(emu(20), body_top + emu(120), emu(200), emu(20)),
                    bold=True, size=9, color=ORANGE)
    roles = [
        ("鈴木（HON）", "プロジェクト責任者・コンサル担当",
         "・戦略立案・全体進行管理\n・月次MTGファシリテート\n・クライアントとの窓口"),
        ("HON WEBチーム", "EC運用代行担当",
         "・Amazon商品ページ作成・更新\n・広告運用・入札管理\n・月次レポート作成"),
        ("岡崎食品 様", "クライアント・情報提供",
         "・商品写真・JANコードの提供\n・商標登録の確認・手続き\n・月次MTGへのご参加"),
    ]
    card_w = emu(290)
    card_h = emu(210)
    for i, (name, title, items) in enumerate(roles):
        left = emu(20) + i * (card_w + emu(25))
        top = body_top + emu(146)
        sb.add_shape(slide_id, "RECTANGLE", mk_rect(left, top, card_w, card_h),
                      fill_color={"red": 0.976, "green": 0.976, "blue": 0.976})
        sb.add_textbox(slide_id, name,
                        mk_rect(left + emu(10), top + emu(10), card_w - emu(20), emu(22)),
                        bold=True, size=11, color=DARK_BLUE)
        sb.add_textbox(slide_id, title,
                        mk_rect(left + emu(10), top + emu(34), card_w - emu(20), emu(18)),
                        bold=False, size=8, color=GRAY_TEXT)
        sb.add_textbox(slide_id, items,
                        mk_rect(left + emu(10), top + emu(56), card_w - emu(20), card_h - emu(68)),
                        bold=False, size=9, color=DARK_TEXT, valign="TOP")


def build_next_actions(sb, slide_id):
    body_top = sb.add_header(slide_id, "次のアクション — まずここから始めます", "NEXT ACTIONS")

    actions = [
        ("1", "商標登録の有無を確認する",
         "ブランドレジストリ申請には商標登録番号が必要です。「岡崎」「納豆麹漬」などの商標登録状況をご確認ください。",
         "岡崎食品 様"),
        ("2", "JANコード・商品写真の素材を共有いただく",
         "主力3商品のJANコードと高解像度商品写真（白背景推奨）をご用意ください。",
         "岡崎食品 様"),
        ("3", "Amazonセラーセントラル アカウント開設に着手",
         "法人名義（有限会社岡崎）でプロフェッショナル出品アカウントを開設します。法人確認書類・銀行口座・クレジットカードをご準備ください。",
         "HON + 岡崎食品"),
        ("4", "既存6件のAmazonページを目視確認する",
         "出品者「要確認」の4件について実際のAmazonページで「販売元」を確認し、無断出品の証拠として記録します。",
         "HON"),
    ]
    item_h = emu(100)
    for i, (num, title, detail, owner) in enumerate(actions):
        top = body_top + emu(20) + i * (item_h + emu(10))
        # カード背景
        sb.add_shape(slide_id, "RECTANGLE",
                      mk_rect(emu(20), top, emu(920), item_h),
                      fill_color=GRAY_BG)
        # 番号サークル
        sb.add_shape(slide_id, "ELLIPSE",
                      mk_rect(emu(28), top + emu(30), emu(36), emu(36)),
                      fill_color=ORANGE)
        sb.add_textbox(slide_id, num,
                        mk_rect(emu(28), top + emu(30), emu(36), emu(36)),
                        bold=True, size=12, color=WHITE, align="CENTER")
        # タイトル
        sb.add_textbox(slide_id, title,
                        mk_rect(emu(76), top + emu(10), emu(720), emu(26)),
                        bold=True, size=11, color=DARK_BLUE, valign="TOP")
        # 詳細
        sb.add_textbox(slide_id, detail,
                        mk_rect(emu(76), top + emu(38), emu(720), emu(52)),
                        bold=False, size=9, color={"red": 0.3, "green": 0.3, "blue": 0.3}, valign="TOP")
        # オーナー
        sb.add_shape(slide_id, "ROUND_RECTANGLE",
                      mk_rect(emu(808), top + emu(35), emu(118), emu(26)),
                      fill_color={"red": 0.878, "green": 0.878, "blue": 0.878})
        sb.add_textbox(slide_id, owner,
                        mk_rect(emu(808), top + emu(35), emu(118), emu(26)),
                        bold=True, size=8, color={"red": 0.4, "green": 0.4, "blue": 0.4}, align="CENTER")


# ─── メイン ──────────────────────────────────────────────
def main():
    print("🔑 Google認証中...")
    creds = get_credentials()
    slides_svc = build("slides", "v1", credentials=creds)

    print("📄 プレゼンテーション作成中...")
    prs = slides_svc.presentations().create(body={
        "title": "岡崎食品 Amazon正規化提案書",
        "pageSize": {
            "width":  {"magnitude": emu(960), "unit": "EMU"},
            "height": {"magnitude": emu(540), "unit": "EMU"},
        },
    }).execute()
    pid = prs["presentationId"]
    print(f"✅ プレゼンテーション作成: {pid}")

    # 既存の空スライドIDを取得
    prs = slides_svc.presentations().get(presentationId=pid).execute()
    existing_slide_id = prs["slides"][0]["objectId"]

    sb = SlideBuilder(slides_svc, pid)

    print("🎨 スライドを生成中...")
    slide_configs = [
        ("表紙",           build_cover),
        ("現状の問題",     build_problems),
        ("無断出品一覧",   build_asin_list),
        ("提案全体像",     build_overview),
        ("Phase1詳細",    None),  # 後で個別処理
        ("Phase2詳細",    None),
        ("Phase3詳細",    None),
        ("スケジュール",   build_schedule),
        ("KPI目標",        build_kpi),
        ("費用・体制",     build_cost),
        ("次のアクション", build_next_actions),
    ]

    # スライドを追加
    slide_ids = [existing_slide_id]
    for i in range(len(slide_configs) - 1):
        sid = sb.new_id("slide")
        sb.requests.append({"createSlide": {"objectId": sid, "slideLayoutReference": {"predefinedLayout": "BLANK"}}})
        slide_ids.append(sid)
    sb.flush()

    # 各スライドの内容を生成
    build_cover(sb, slide_ids[0]); sb.flush(); print("  ✓ 表紙")
    build_problems(sb, slide_ids[1]); sb.flush(); print("  ✓ 現状の問題")
    build_asin_list(sb, slide_ids[2]); sb.flush(); print("  ✓ 無断出品一覧")
    build_overview(sb, slide_ids[3]); sb.flush(); print("  ✓ 提案全体像")

    # Phase 1
    build_phase_detail(sb, slide_ids[4], "1", "基盤整備", "1〜2ヶ月目",
        ec_items=["Amazonセラーセントラル アカウント開設代行",
                  "主力3商品の商品ページ新規作成（タイトル・5点箇条書き・説明文）",
                  "商品画像のリサイズ・Amazonガイドライン対応",
                  "JANコード・ASINの整備",
                  "ブランドレジストリ申請（商標確認後）"],
        consul_items=["無断出品の全棚卸し（6件＋追加確認）",
                      "商品ラインナップ整理（何を・どの順で・どの価格で出品するか）",
                      "競合調査（類似商品の価格帯・レビュー数・差別化ポイント）",
                      "ブランドコンセプトの言語化（商品ページ全体のトーン統一）",
                      "月次レポート共有（出品進捗・競合ベンチマーク）"],
        kpis=[("正規ページ\n出品数", "3商品", "▸ 主力品から"),
              ("ブランドレジストリ", "申請完了", "▸ 保護開始"),
              ("競合調査レポート", "1本", "▸ 月1回MTG"),
              ("無断出品\n棚卸し", "完了", "▸ 全件特定")]
    ); sb.flush(); print("  ✓ Phase 1")

    # Phase 2
    build_phase_detail(sb, slide_ids[5], "2", "正規化・信頼構築", "2〜4ヶ月目",
        ec_items=["ブランドレジストリ経由の無断出品削除申請（全6件）",
                  "正規ページへの購買集約（カタログ統合申請）",
                  "Amazon スポンサープロダクト広告の初期設定・運用開始",
                  "全商品の正規ページへの拡大出品",
                  "同梱物（レビュー依頼カード）の設計・提案"],
        consul_items=["商品ページ改善提案（CTR・CVRのデータを見ながら）",
                      "レビュー獲得施策の設計（同梱物・フォローメール活用）",
                      "価格戦略の見直し（競合対比・利益率チェック）",
                      "広告効果測定（ROAS・ACoS管理）",
                      "月次レポート共有（売上・注文数・CVR・広告費）"],
        kpis=[("月間売上\n（Amazon）", "5万円〜", "▸ 立ち上げ期"),
              ("レビュー件数", "各10件〜", "▸ 信頼構築"),
              ("無断出品\n削除申請", "主要品", "▸ 順次排除"),
              ("広告 ACoS", "30%以下", "▸ 効率化")]
    ); sb.flush(); print("  ✓ Phase 2")

    # Phase 3
    build_phase_detail(sb, slide_ids[6], "3", "成長・拡大", "5ヶ月目〜",
        ec_items=["広告予算最適化・入札戦略の高度化",
                  "新商品（あんぽ柿・もも加工品など）の追加出品",
                  "セール・クーポン施策の実施（プライムデー・年末年始）",
                  "楽天市場への並行出品（申請・ページ作成）",
                  "無断出品の完全排除・継続監視"],
        consul_items=["楽天・Amazonの売上比較分析と注力チャネルの判断",
                      "新商品開発へのECフィードバック（レビューの声を製品改善へ）",
                      "自社ECサイト（BASE / Shopify）への展開検討",
                      "SNS・コンテンツマーケティングとの連携提案",
                      "中長期ロードマップ（年次）の更新・共有"],
        kpis=[("月間売上\n（Amazon）", "20万円〜", "▸ 成長軌道"),
              ("レビュー件数", "各30件〜", "▸ 信頼確立"),
              ("出品商品数", "全商品", "▸ 新商品含む"),
              ("楽天市場\n出店", "稼働開始", "▸ 複数チャネル")]
    ); sb.flush(); print("  ✓ Phase 3")

    build_schedule(sb, slide_ids[7]); sb.flush(); print("  ✓ スケジュール")
    build_kpi(sb, slide_ids[8]); sb.flush(); print("  ✓ KPI目標")
    build_cost(sb, slide_ids[9]); sb.flush(); print("  ✓ 費用・体制")
    build_next_actions(sb, slide_ids[10]); sb.flush(); print("  ✓ 次のアクション")

    url = f"https://docs.google.com/presentation/d/{pid}/edit"
    print(f"\n🎉 完成！")
    print(f"📎 URL: {url}")
    return url


if __name__ == "__main__":
    main()
