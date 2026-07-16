/**
 * update-homepage.js
 * HON商店 トップページ更新スクリプト
 *
 * 実行: node --env-file=.env scripts/update-homepage.js
 *
 * 変更内容:
 *   - トップページを8セクション構成に刷新
 *   - 和レトロモダンCSS（藍色×生成り×明朝体）を適用
 *   - 「ECサイト制作の説明」→「自社商品づくりから販売まで相談できる場所」に転換
 */

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-01';

if (!STORE || !TOKEN) {
  console.error('❌ エラー: SHOPIFY_STORE と SHOPIFY_ACCESS_TOKEN が必要です');
  console.error('   .env.example を .env にコピーして設定してください');
  process.exit(1);
}

const BASE = `https://${STORE}/admin/api/${API_VERSION}`;
const HEADERS = {
  'X-Shopify-Access-Token': TOKEN,
  'Content-Type': 'application/json',
};

// ---------- API ヘルパー ----------

async function shopifyGet(path) {
  const res = await fetch(`${BASE}/${path}`, { headers: HEADERS });
  const json = await res.json();
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} - ${JSON.stringify(json.errors ?? json)}`);
  return json;
}

async function shopifyPut(path, body) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status} - ${JSON.stringify(json.errors ?? json)}`);
  return json;
}

// ---------- Shopify ユーティリティ ----------

async function getPublishedTheme() {
  const { themes } = await shopifyGet('themes.json');
  const main = themes.find((t) => t.role === 'main');
  if (!main) throw new Error('公開中テーマが見つかりません');
  return main;
}

async function getAsset(themeId, key) {
  const encoded = encodeURIComponent(key);
  const { asset } = await shopifyGet(`themes/${themeId}/assets.json?asset[key]=${encoded}`);
  return asset;
}

async function putAsset(themeId, key, value) {
  return shopifyPut(`themes/${themeId}/assets.json`, { asset: { key, value } });
}

async function findCollectionHandle() {
  try {
    const { custom_collections } = await shopifyGet('custom_collections.json?limit=10');
    // おすすめ → 優先
    const osusume = custom_collections.find(
      (c) => c.title === 'おすすめ' || c.title.includes('おすすめ'),
    );
    if (osusume) return osusume.handle;
    if (custom_collections.length > 0) return custom_collections[0].handle;
  } catch {}
  return 'all';
}

// ---------- CSS（和レトロモダン） ----------

const CUSTOM_CSS = `
/* ================================================
   HON商店 — 和レトロモダン スタイル
   藍色 × 生成り × 明朝体
   ================================================ */
@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&family=Noto+Sans+JP:wght@300;400;500&display=swap');

:root {
  --hon-indigo:      #2C4770;
  --hon-indigo-dark: #1B3154;
  --hon-gold:        #C8A06A;
  --hon-cream:       #FAFAF7;
  --hon-cream-mid:   #F2EDE4;
  --hon-text:        #2A2A2A;
  --hon-muted:       #6A6A6A;
  --hon-border:      rgba(44,71,112,0.18);
}

/* ---- 共通ラベル（判子風） ---- */
.hon-label {
  display: inline-block;
  font-size: .72rem;
  letter-spacing: .18em;
  color: var(--hon-gold);
  border: 1px solid var(--hon-gold);
  padding: 4px 14px;
  margin-bottom: 14px;
  font-family: 'Noto Sans JP', sans-serif;
}

/* ---- h2 共通 ---- */
.hon-h2 {
  font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', serif;
  color: var(--hon-indigo);
  font-size: clamp(1.45rem, 2.8vw, 2rem);
  font-weight: 600;
  line-height: 1.55;
  letter-spacing: .04em;
  margin: 0 0 32px;
}

/* ======================================
   1. ファーストビュー
   ====================================== */
.hon-hero {
  background: var(--hon-indigo);
  padding: 80px 24px 96px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
/* 格子テクスチャ */
.hon-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg,  transparent, transparent 19px, rgba(255,255,255,.04) 19px, rgba(255,255,255,.04) 20px),
    repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,.04) 19px, rgba(255,255,255,.04) 20px);
  pointer-events: none;
}
/* 上下二重罫線 */
.hon-hero::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 6px;
  background: linear-gradient(to bottom, var(--hon-gold) 0px, var(--hon-gold) 1px, transparent 1px, transparent 3px, var(--hon-gold) 3px, var(--hon-gold) 4px);
  opacity: .5;
}
.hon-hero__inner {
  position: relative;
  max-width: 680px;
  margin: 0 auto;
}
.hon-hero__kicker {
  font-size: .73rem;
  letter-spacing: .22em;
  color: rgba(255,255,255,.6);
  margin: 0 0 20px;
  font-family: 'Noto Sans JP', sans-serif;
}
.hon-hero h1 {
  font-family: 'Shippori Mincho', serif;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: .04em;
  color: #fff;
  margin: 0 0 22px;
}
.hon-hero__sub {
  font-size: clamp(.88rem, 1.8vw, 1.02rem);
  line-height: 1.95;
  color: rgba(255,255,255,.8);
  margin: 0 0 40px;
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 300;
}
.hon-btn {
  display: inline-block;
  padding: 14px 42px;
  background: #fff;
  color: var(--hon-indigo);
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .93rem;
  letter-spacing: .1em;
  font-weight: 500;
  text-decoration: none;
  border: 2px solid #fff;
  transition: all .25s;
}
.hon-btn:hover { background: transparent; color: #fff; }

/* ======================================
   2. お悩みセクション
   ====================================== */
.hon-concerns {
  background: var(--hon-cream);
  padding: 68px 24px;
  border-top: 3px double rgba(44,71,112,.14);
  border-bottom: 1px solid var(--hon-border);
}
.hon-concerns__inner {
  max-width: 840px;
  margin: 0 auto;
  text-align: center;
}
.hon-concerns__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
  margin-top: 36px;
  text-align: left;
}
.hon-concern-item {
  background: #fff;
  border: 1px solid var(--hon-border);
  padding: 18px 22px 18px 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .875rem;
  line-height: 1.72;
  color: var(--hon-text);
}
.hon-concern-item::before {
  content: '▷';
  color: var(--hon-gold);
  flex-shrink: 0;
  font-size: .8rem;
  margin-top: 3px;
}

/* ======================================
   3. サービス（できること）
   ====================================== */
.hon-services {
  padding: 72px 24px;
  background: #fff;
}
.hon-services__inner {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}
.hon-services__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(195px, 1fr));
  gap: 20px;
  margin-top: 44px;
}
.hon-service-card {
  border: 1px solid var(--hon-border);
  padding: 30px 22px 28px;
  text-align: center;
  background: var(--hon-cream);
}
.hon-service-card__num {
  font-family: 'Shippori Mincho', serif;
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--hon-indigo);
  opacity: .22;
  display: block;
  margin-bottom: 6px;
}
.hon-service-card__title {
  font-family: 'Shippori Mincho', serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--hon-indigo);
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--hon-border);
}
.hon-service-card__text {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .83rem;
  line-height: 1.75;
  color: var(--hon-muted);
  text-align: left;
}

/* ======================================
   4. 商品例タグ
   ====================================== */
.hon-examples {
  background: var(--hon-cream-mid);
  padding: 68px 24px;
  border-top: 1px solid var(--hon-border);
}
.hon-examples__inner {
  max-width: 840px;
  margin: 0 auto;
  text-align: center;
}
.hon-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 32px;
}
.hon-tag {
  padding: 8px 18px;
  border: 1px solid var(--hon-indigo);
  color: var(--hon-indigo);
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .82rem;
  letter-spacing: .03em;
  background: #fff;
}

/* ======================================
   5. 流れ（ステップ）
   ====================================== */
.hon-flow {
  padding: 72px 24px;
  background: #fff;
  border-top: 1px solid var(--hon-border);
}
.hon-flow__inner {
  max-width: 660px;
  margin: 0 auto;
  text-align: center;
}
.hon-flow__steps {
  margin-top: 44px;
  text-align: left;
}
.hon-step {
  display: flex;
  gap: 22px;
  padding: 22px 0;
  border-bottom: 1px solid var(--hon-border);
}
.hon-step:first-child { border-top: 1px solid var(--hon-border); }
.hon-step__num {
  font-family: 'Shippori Mincho', serif;
  font-size: 1.65rem;
  font-weight: 700;
  color: var(--hon-indigo);
  opacity: .28;
  min-width: 2.2rem;
  line-height: 1.2;
}
.hon-step__title {
  font-family: 'Shippori Mincho', serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--hon-indigo);
  margin-bottom: 5px;
}
.hon-step__text {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .84rem;
  line-height: 1.72;
  color: var(--hon-muted);
}

/* ======================================
   6. 支援プラン（ネイビー背景）
   ====================================== */
.hon-plans {
  background: var(--hon-indigo);
  padding: 72px 24px;
}
.hon-plans__inner {
  max-width: 840px;
  margin: 0 auto;
  text-align: center;
}
.hon-plans h2 {
  font-family: 'Shippori Mincho', serif;
  font-size: clamp(1.4rem, 2.8vw, 1.9rem);
  font-weight: 600;
  letter-spacing: .04em;
  margin: 0 0 8px;
  color: #fff;
  line-height: 1.55;
}
.hon-plans__sub {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .86rem;
  color: rgba(255,255,255,.6);
  margin-bottom: 44px;
}
.hon-plans__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  text-align: left;
}
.hon-plan {
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.18);
  padding: 22px 18px;
}
.hon-plan__name {
  font-family: 'Shippori Mincho', serif;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 7px;
}
.hon-plan__price {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .82rem;
  color: var(--hon-gold);
  margin-bottom: 8px;
  font-weight: 500;
}
.hon-plan__desc {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .78rem;
  color: rgba(255,255,255,.58);
  line-height: 1.65;
}
.hon-plans__note {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .81rem;
  color: rgba(255,255,255,.48);
  margin-bottom: 26px;
}
.hon-btn--w {
  display: inline-block;
  padding: 14px 42px;
  background: #fff;
  color: var(--hon-indigo);
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .93rem;
  letter-spacing: .1em;
  font-weight: 500;
  text-decoration: none;
  border: 2px solid #fff;
  transition: all .25s;
}
.hon-btn--w:hover { background: transparent; color: #fff; }

/* ======================================
   7. 商品デモ見出し
   ====================================== */
.hon-demo-banner {
  background: var(--hon-cream);
  padding: 48px 24px 32px;
  border-top: 1px solid var(--hon-border);
  text-align: center;
}
.hon-demo-banner__inner { max-width: 840px; margin: 0 auto; }
.hon-demo-note {
  border: 1px solid var(--hon-border);
  padding: 16px 22px;
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .83rem;
  line-height: 1.78;
  color: var(--hon-muted);
  margin-top: 16px;
}

/* ======================================
   8. CTA（最終）
   ====================================== */
.hon-cta {
  padding: 84px 24px;
  text-align: center;
  background: var(--hon-cream);
  border-top: 3px double rgba(44,71,112,.14);
}
.hon-cta__inner { max-width: 580px; margin: 0 auto; }
.hon-cta h2 {
  font-family: 'Shippori Mincho', serif;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  color: var(--hon-indigo);
  margin: 0 0 18px;
  line-height: 1.5;
}
.hon-cta__text {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .93rem;
  line-height: 1.92;
  color: var(--hon-muted);
  margin-bottom: 36px;
}
.hon-btn--o {
  display: inline-block;
  padding: 13px 38px;
  background: transparent;
  border: 1px solid var(--hon-indigo);
  color: var(--hon-indigo);
  font-family: 'Noto Sans JP', sans-serif;
  font-size: .93rem;
  letter-spacing: .1em;
  text-decoration: none;
  transition: all .25s;
  font-weight: 500;
}
.hon-btn--o:hover { background: var(--hon-indigo); color: #fff; }

/* レスポンシブ */
@media (max-width: 640px) {
  .hon-services__grid  { grid-template-columns: 1fr 1fr; }
  .hon-plans__grid     { grid-template-columns: 1fr 1fr; }
  .hon-concerns__grid  { grid-template-columns: 1fr; }
}
`.trim();

// ---------- セクション HTML ----------

function heroHTML() {
  return `<style id="hon-styles">${CUSTOM_CSS}</style>
<section class="hon-hero">
  <div class="hon-hero__inner">
    <p class="hon-hero__kicker">自社商品づくりから販売まで、ワンストップで</p>
    <h1>あなたの想いを、<br>売れるオリジナル商品に。</h1>
    <p class="hon-hero__sub">
      商品企画・OEM・ブランド設計・Shopifyでの販売開始まで。<br>
      自社商品づくりを、はじめの一歩から伴走します。
    </p>
    <a href="/pages/schedule" class="hon-btn">無料相談を予約する</a>
  </div>
</section>`;
}

function concernsHTML() {
  return `<section class="hon-concerns">
  <div class="hon-concerns__inner">
    <span class="hon-label">こんなお悩みありませんか？</span>
    <h2 class="hon-h2">商品づくりやEC販売、<br>どこに相談すればいいかわからない方へ</h2>
    <div class="hon-concerns__grid">
      <div class="hon-concern-item">オリジナル商品を作りたいが、何から始めればいいかわからない</div>
      <div class="hon-concern-item">OEM先や製造先をどう探せばいいかわからない</div>
      <div class="hon-concern-item">商品はあるけれど、ネットでの売り方がわからない</div>
      <div class="hon-concern-item">店舗・サロン・スクールの売上を物販で伸ばしたい</div>
      <div class="hon-concern-item">SNSや紹介で売れる導線を整えたい</div>
      <div class="hon-concern-item">ShopifyやBASEなど、どれを選ぶべきかわからない</div>
    </div>
  </div>
</section>`;
}

function servicesHTML() {
  return `<section class="hon-services">
  <div class="hon-services__inner">
    <span class="hon-label">HON商店ができること</span>
    <h2 class="hon-h2">オリジナル商品づくり、<br>どこからでも相談できます。</h2>
    <div class="hon-services__grid">
      <div class="hon-service-card">
        <span class="hon-service-card__num">01</span>
        <div class="hon-service-card__title">商品企画</div>
        <p class="hon-service-card__text">誰に、何を、いくらで売るかを整理します。ギフト向け・定期販売向けなど、販売方法も含めて設計します。</p>
      </div>
      <div class="hon-service-card">
        <span class="hon-service-card__num">02</span>
        <div class="hon-service-card__title">OEM・製造相談</div>
        <p class="hon-service-card__text">食品・雑貨・美容・アパレルなど、作りたい商品の方向性に合わせて、製造方法や相談先を一緒に整理します。</p>
      </div>
      <div class="hon-service-card">
        <span class="hon-service-card__num">03</span>
        <div class="hon-service-card__title">ブランド設計</div>
        <p class="hon-service-card__text">商品名、コンセプト、パッケージ、写真、商品説明など、選ばれる見せ方を整えます。</p>
      </div>
      <div class="hon-service-card">
        <span class="hon-service-card__num">04</span>
        <div class="hon-service-card__title">ECサイト制作</div>
        <p class="hon-service-card__text">Shopifyを中心に、商品ページ・決済・配送・予約販売・問い合わせ導線まで整えます。</p>
      </div>
    </div>
  </div>
</section>`;
}

function examplesHTML() {
  const tags = [
    'サロン向けオリジナルシャンプー・美容商品',
    'ジム・整体院向けプロテイン・ケア用品',
    '飲食店のギフト商品・冷凍食品',
    '地域産品を使ったオリジナル食品',
    '会社・ブランドのノベルティ',
    'アパレル・バッグ・革小物',
    '講座・ノウハウのデジタルコンテンツ',
  ];
  return `<section class="hon-examples">
  <div class="hon-examples__inner">
    <span class="hon-label">作れる商品の例</span>
    <h2 class="hon-h2">たとえば、こんな自社商品が作れます。</h2>
    <div class="hon-tags">
      ${tags.map((t) => `<span class="hon-tag">${t}</span>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function flowHTML() {
  const steps = [
    ['無料相談',              '作りたい商品や現在の状況をお聞きします。'],
    ['商品企画・方向性整理',  'ターゲット、価格、販売方法、必要な準備を整理します。'],
    ['OEM・制作方法の検討',   '製造先、ロット、原価、納期などを確認します。'],
    ['ブランド・販売ページ設計', '商品名、写真、説明文、デザインの方向性を整えます。'],
    ['Shopifyで販売開始',     '決済・配送・商品ページ・問い合わせ導線を整えて公開します。'],
    ['販売後の改善',          '売れ方を見ながら、商品ページや導線を改善します。'],
  ];
  const items = steps.map(([title, text], i) => `      <div class="hon-step">
        <span class="hon-step__num">0${i + 1}</span>
        <div>
          <div class="hon-step__title">${title}</div>
          <p class="hon-step__text">${text}</p>
        </div>
      </div>`).join('\n');
  return `<section class="hon-flow">
  <div class="hon-flow__inner">
    <span class="hon-label">相談から販売開始までの流れ</span>
    <h2 class="hon-h2">はじめての方でも、<br>ステップで進められます。</h2>
    <div class="hon-flow__steps">
${items}
    </div>
  </div>
</section>`;
}

function plansHTML() {
  const plans = [
    ['相談プラン',    '¥30,000〜',   '商品企画・販売方法の壁打ち'],
    ['スタートプラン','¥100,000〜',  '小規模EC立ち上げ・商品登録'],
    ['商品化サポート','¥300,000〜',  'OEM相談・ブランド設計・EC導線設計'],
    ['伴走プラン',    '要相談',       '商品づくりから販売改善まで継続支援'],
  ];
  const cards = plans.map(([name, price, desc]) => `      <div class="hon-plan">
        <div class="hon-plan__name">${name}</div>
        <div class="hon-plan__price">${price}</div>
        <p class="hon-plan__desc">${desc}</p>
      </div>`).join('\n');
  return `<section class="hon-plans">
  <div class="hon-plans__inner">
    <span class="hon-label" style="color:var(--hon-gold);border-color:var(--hon-gold)">支援プラン</span>
    <h2>ご相談内容に合わせて、<br>必要な部分だけ支援します。</h2>
    <p class="hon-plans__sub">価格よりも、まず「何が必要か」を整理することが大切です。</p>
    <div class="hon-plans__grid">
${cards}
    </div>
    <p class="hon-plans__note">※ まずは無料相談で、必要な支援範囲を一緒に整理します。</p>
    <a href="/pages/schedule" class="hon-btn--w">無料相談を予約する</a>
  </div>
</section>`;
}

function demoBannerHTML() {
  return `<section class="hon-demo-banner">
  <div class="hon-demo-banner__inner">
    <span class="hon-label">商品一覧</span>
    <h2 class="hon-h2" style="margin-bottom:16px">Shopifyで、<br>こんな売り方ができます。</h2>
    <div class="hon-demo-note">
      このストア自体も、Shopifyで作られたECサイトのサンプルです。<br>
      デジタル商品・物販・予約導線など、実際の販売形式を体験できます。
    </div>
  </div>
</section>`;
}

function ctaHTML() {
  return `<section class="hon-cta">
  <div class="hon-cta__inner">
    <span class="hon-label">無料相談受付中</span>
    <h2>まずは、<br>作りたいものを聞かせてください。</h2>
    <p class="hon-cta__text">
      商品がまだ決まっていなくても大丈夫です。<br>
      「自社商品を作りたい」「今ある商品をネットで売りたい」「OEMで何か始めたい」など、<br>
      現在の状況に合わせて、最初の一歩を一緒に整理します。
    </p>
    <a href="/pages/schedule" class="hon-btn--o">相談日時を選ぶ</a>
  </div>
</section>`;
}

// ---------- templates/index.json 組み立て ----------

function buildIndexJSON(collectionHandle) {
  return {
    sections: {
      'hon-hero': {
        type: 'custom-liquid',
        settings: { custom_liquid: heroHTML() },
      },
      'hon-concerns': {
        type: 'custom-liquid',
        settings: { custom_liquid: concernsHTML() },
      },
      'hon-services': {
        type: 'custom-liquid',
        settings: { custom_liquid: servicesHTML() },
      },
      'hon-examples': {
        type: 'custom-liquid',
        settings: { custom_liquid: examplesHTML() },
      },
      'hon-flow': {
        type: 'custom-liquid',
        settings: { custom_liquid: flowHTML() },
      },
      'hon-plans': {
        type: 'custom-liquid',
        settings: { custom_liquid: plansHTML() },
      },
      'hon-demo-banner': {
        type: 'custom-liquid',
        settings: { custom_liquid: demoBannerHTML() },
      },
      'hon-products': {
        type: 'featured-collection',
        settings: {
          heading: '',
          collection: collectionHandle,
          products_to_show: 6,
          columns_desktop: 3,
          full_width: false,
          show_view_all: true,
          view_all_style: 'outline',
          image_ratio: 'adapt',
          show_secondary_image: false,
          show_vendor: false,
          show_rating: false,
          enable_quick_add: false,
        },
      },
      'hon-cta': {
        type: 'custom-liquid',
        settings: { custom_liquid: ctaHTML() },
      },
    },
    order: [
      'hon-hero',
      'hon-concerns',
      'hon-services',
      'hon-examples',
      'hon-flow',
      'hon-plans',
      'hon-demo-banner',
      'hon-products',
      'hon-cta',
    ],
  };
}

// ---------- メイン ----------

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' HON商店 トップページ更新スクリプト');
  console.log(` ストア: ${STORE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. 公開テーマを取得
  process.stdout.write('1. 公開中テーマを取得... ');
  const theme = await getPublishedTheme();
  console.log(`✓ "${theme.name}" (ID: ${theme.id})`);

  // 2. 現在の index.json を取得（確認用）
  process.stdout.write('2. 現在のindex.jsonを確認... ');
  const current = await getAsset(theme.id, 'templates/index.json');
  console.log(`✓ 取得完了`);

  // 3. コレクションハンドルを取得
  process.stdout.write('3. コレクションハンドルを確認... ');
  const collectionHandle = await findCollectionHandle();
  console.log(`✓ "${collectionHandle}" を使用`);

  // 4. 新しい index.json を生成
  process.stdout.write('4. 新しいトップページ構成を生成... ');
  const newIndex = buildIndexJSON(collectionHandle);
  console.log(`✓ ${newIndex.order.length}セクション`);

  // 5. アップロード
  process.stdout.write('5. templates/index.json を更新... ');
  await putAsset(theme.id, 'templates/index.json', JSON.stringify(newIndex, null, 2));
  console.log('✓ 完了');

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' ✅ トップページ更新完了！');
  console.log(`    🔗 https://${STORE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(' 📝 確認事項:');
  console.log('    - テーマエディターで各セクションの表示を確認');
  console.log('    - 商品一覧が表示されない場合、テーマエディターで');
  console.log('      コレクションを手動で設定してください');
}

main().catch((err) => {
  console.error('');
  console.error(`❌ エラー: ${err.message}`);
  process.exit(1);
});
