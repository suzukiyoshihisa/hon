# すーさんのEC相談所 — ストア書き換えスクリプト

仮ストア（gdzkvq-hn.myshopify.com・旧WANSIE DESIGN）を、決定済みの原稿
`07_自社事業/EC相談所/EC相談所_ページ原稿.md` の内容に書き換える。（ツリーA-2）

## セットアップ（初回のみ・手作業5分）

1. `.env.example` を `.env` にコピー
2. Shopify管理画面でカスタムアプリを作成してAdmin APIトークンを取得（手順は `.env.example` 内）
3. `.env` にトークンを記入

## 実行

```bash
cd "tools/ec-soudanjo"
npm run check   # 接続確認・現状一覧（書き込みなし）
npm run all     # バックアップ→商品→ページ→ナビ→トップの一括実行
```

個別実行: `npm run backup` / `products` / `pages` / `nav` / `home`

## 各ステップの内容

| ステップ | 内容 |
|---------|------|
| backup | 現在の `templates/index.json`・商品・ページを `backups/` に保存 |
| products | 旧商品（Plan_A/B/C・PRO会員・グッズ等）を**下書き化**（削除しない）＋「無料相談60分（オンライン）」を作成 |
| pages | `/pages/services`・`/pages/consultation`・`/pages/works` を作成/更新（SEOメタ付き） |
| nav | メインメニューを「ホーム/サービスと料金/無料相談を予約する/制作事例・プロフィール/お問い合わせ」に |
| home | トップページを原稿どおり6セクション（ヒーロー/悩み/流れ/種明かし/料金/クロージング）に差し替え |

## APIでできない残り手作業

- **ストア名変更**: 設定 → ストア詳細 → 「WANSIE DESIGN」→「すーさんのEC相談所」（H1・titleに反映される）
- 英語残骸: フッターの「Join our email list」・Country/Regionセレクタはテーマカスタマイズ画面でオフ/日本語化
- TimeRex予約は当面リンク方式（原稿の実装方法B）。埋め込み（方法A）は後日カスタムLiquidで

## 予約導線

TimeRex: https://timerex.net/s/mf37459_3480/0cee8e7c （60分・稼働確認済み）
