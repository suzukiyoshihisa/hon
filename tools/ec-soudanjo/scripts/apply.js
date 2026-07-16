/**
 * apply.js — 仮ストア（WANSIE DESIGN）を「すーさんのEC相談所」に書き換える
 *
 * 原稿の正: 05_営業/EC相談所_ページ原稿.md（2026-07-10完成版）
 *
 * 実行:
 *   node --env-file=.env scripts/apply.js check     … 接続確認・現状一覧（書き込みなし）
 *   node --env-file=.env scripts/apply.js backup    … 現状のindex.json等をbackups/に保存
 *   node --env-file=.env scripts/apply.js products  … 旧商品を下書き化＋「無料相談60分」作成
 *   node --env-file=.env scripts/apply.js pages     … サービス/無料相談/事例・プロフィールの3ページ作成
 *   node --env-file=.env scripts/apply.js nav       … メインメニュー更新
 *   node --env-file=.env scripts/apply.js home      … トップページ差し替え（実行前に自動バックアップ）
 *   node --env-file=.env scripts/apply.js all       … backup→products→pages→nav→home を一括実行
 *
 * 注意（APIでできないため手作業）:
 *   - ストア名の変更: 設定→ストア詳細→「WANSIE DESIGN」→「すーさんのEC相談所」
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2025-01';
const TIMEREX_URL = 'https://timerex.net/s/mf37459_3480/0cee8e7c';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!STORE || !TOKEN) {
  console.error('❌ SHOPIFY_STORE と SHOPIFY_ACCESS_TOKEN が必要です（.env.example参照）');
  process.exit(1);
}

const BASE = `https://${STORE}/admin/api/${API_VERSION}`;
const HEADERS = { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' };

// ---------- APIヘルパー ----------

async function rest(method, p, body) {
  const res = await fetch(`${BASE}/${p}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${method} ${p}: ${res.status} - ${JSON.stringify(json.errors ?? json)}`);
  return json;
}
const get = (p) => rest('GET', p);
const post = (p, b) => rest('POST', p, b);
const put = (p, b) => rest('PUT', p, b);

async function graphql(query, variables = {}) {
  const res = await fetch(`${BASE}/graphql.json`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function getMainTheme() {
  const { themes } = await get('themes.json');
  const main = themes.find((t) => t.role === 'main');
  if (!main) throw new Error('公開中テーマが見つかりません');
  return main;
}

async function getAsset(themeId, key) {
  const { asset } = await get(`themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`);
  return asset;
}

// ---------- check ----------

async function stepCheck() {
  const { shop } = await get('shop.json');
  console.log(`🏪 ストア: ${shop.name}（${shop.myshopify_domain}）plan=${shop.plan_name}`);
  const theme = await getMainTheme();
  console.log(`🎨 公開テーマ: ${theme.name} (id=${theme.id})`);
  const { products } = await get('products.json?limit=250&fields=id,title,handle,status');
  console.log(`📦 商品 ${products.length}件:`);
  for (const p of products) console.log(`   - [${p.status}] ${p.title} (${p.handle})`);
  const { pages } = await get('pages.json?limit=250&fields=id,title,handle');
  console.log(`📄 ページ ${pages.length}件:`);
  for (const p of pages) console.log(`   - ${p.title} (/pages/${p.handle})`);
  const menus = await graphql(`{ menus(first: 25) { nodes { id handle title items { title type url } } } }`);
  for (const m of menus.menus.nodes) {
    console.log(`🧭 メニュー ${m.title} (${m.handle}): ${m.items.map((i) => i.title).join(' / ')}`);
  }
}

// ---------- backup ----------

async function stepBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const theme = await getMainTheme();
  const index = await getAsset(theme.id, 'templates/index.json');
  fs.writeFileSync(path.join(BACKUP_DIR, `index_${stamp}.json`), index.value ?? '');
  const { products } = await get('products.json?limit=250');
  fs.writeFileSync(path.join(BACKUP_DIR, `products_${stamp}.json`), JSON.stringify(products, null, 2));
  const { pages } = await get('pages.json?limit=250');
  fs.writeFileSync(path.join(BACKUP_DIR, `pages_${stamp}.json`), JSON.stringify(pages, null, 2));
  console.log(`💾 バックアップ完了: backups/*_${stamp}.json`);
}

// ---------- products ----------

const CONSULT_HANDLE = 'free-consultation-60';

async function stepProducts() {
  const { products } = await get('products.json?limit=250&fields=id,title,handle,status');

  let consult = products.find((p) => p.handle === CONSULT_HANDLE);
  if (!consult) {
    const created = await post('products.json', {
      product: {
        title: '無料相談60分（オンライン）',
        handle: CONSULT_HANDLE,
        status: 'active',
        vendor: 'すーさんのEC相談所',
        product_type: '相談',
        tags: '相談, 無料',
        body_html:
          '<p>サイトのこと、売る商品のこと、予約の受け方のこと。60分、無料でご相談を受けています。</p>' +
          '<p>相談だけでOK。こちらから営業は一切しません。</p>' +
          `<p><a href="/pages/consultation">予約ページから日時を選ぶ（30秒で完了）</a></p>`,
        variants: [{ price: '0', requires_shipping: false, taxable: false, sku: 'SOUDAN-FREE-60' }],
      },
    });
    consult = created.product;
    console.log(`✅ 商品作成: ${consult.title} (/products/${consult.handle})`);
  } else {
    console.log(`↩️ 既存の相談商品あり: ${consult.title}`);
  }

  for (const p of products) {
    if (p.handle === CONSULT_HANDLE) continue;
    if (p.status !== 'draft') {
      await put(`products/${p.id}.json`, { product: { id: p.id, status: 'draft' } });
      console.log(`🙈 下書き化: ${p.title}`);
    }
  }
  console.log('✅ products 完了（旧商品はすべて下書き＝非公開。削除はしていません）');
}

// ---------- pages ----------

const PAGE_CSS = `
<style>
.sd { font-family: 'Noto Sans JP', sans-serif; color: #2a2a2a; line-height: 1.9; }
.sd h2 { font-size: 1.45rem; color: #1f5b4e; margin: 2.2em 0 .8em; line-height: 1.5; }
.sd h3 { font-size: 1.1rem; color: #1f5b4e; margin: 1.6em 0 .5em; }
.sd .sd-lead { font-size: 1.05rem; }
.sd .sd-note { color: #6a6a6a; font-size: .9rem; }
.sd table { width: 100%; border-collapse: collapse; margin: 1em 0; }
.sd th, .sd td { border: 1px solid #ddd6c8; padding: .7em .9em; text-align: left; }
.sd th { background: #f4f1e8; }
.sd .sd-btn { display: inline-block; background: #1f5b4e; color: #fff !important; padding: 14px 34px;
  border-radius: 999px; text-decoration: none; font-weight: 600; margin: 1.2em 0; }
.sd .sd-btn:hover { opacity: .85; }
.sd .sd-cta { text-align: center; background: #f4f1e8; padding: 2em 1.5em; border-radius: 12px; margin: 2.5em 0 1em; }
.sd ol, .sd ul { padding-left: 1.4em; }
.sd .sd-strong { color: #1f5b4e; font-weight: 700; }
</style>`;

const CTA_BLOCK = (label = '無料相談を予約する（60分・無料）') => `
<div class="sd-cta">
  <h3>まずは60分、話しませんか</h3>
  <p>相談だけで終わっても、まったく構いません。こちらから営業の連絡もしません。</p>
  <a class="sd-btn" href="/pages/consultation">${label}</a>
</div>`;

const PAGES = [
  {
    handle: 'services',
    title: 'サービスと料金',
    titleTag: 'サービスと料金｜予約つきECサイト構築＋月額運用｜すーさんのEC相談所',
    descTag:
      '売る商品の設計から、予約・決済つきサイトの構築、公開後の月額運用までワンパッケージ。初期構築20万円〜、月額運用2万円〜。内訳はすべてこのページで公開しています。',
    body: `${PAGE_CSS}<div class="sd">
<p class="sd-lead"><span class="sd-strong">一言でいうと——</span><br>
あなたのお店・事務所の「入口になる商品」を一緒に決めて、予約も購入もできるサイトを安く早く作り、その後の面倒を月額でぜんぶ見るパッケージです。</p>

<h2>このパッケージが向いている方</h2>
<ul>
<li>予約が必要な商売（サロン・教室・飲食・士業の相談枠など）なのに、WEBからの予約導線がない</li>
<li>サイトはあるが古くなっていて、更新も止まっている</li>
<li>「何を目玉にしてWEBで売ればいいか」自体から相談したい</li>
</ul>
<p>逆に、「大規模な通販サイトを作りたい」「広告をがんがん回したい」という方には、もっと合う会社があります。無料相談の場でも、合わないと思ったら正直にそうお伝えします。</p>

<h2>やることは、この4つ</h2>
<h3>① ヒアリング（90分）</h3>
<p>商売の現状・お客さんの層・単価をじっくりお聞きします。そのうえで、<span class="sd-strong">お店の入口になる商品</span>（初めてのお客さんが手に取りやすい、低価格の商品や体験メニュー）<span class="sd-strong">を一緒に設計</span>します。サイト作りはここが一番大事なので、時間をかけます。</p>
<h3>② 構築（2〜3週間）</h3>
<p>入口商品のページ＋<span class="sd-strong">オンライン予約機能</span>＋決済のそろったサイトを構築します。</p>
<ul>
<li>スマホ対応（お客さんの大半はスマホから来ます）</li>
<li>基本のSEO対策込み</li>
<li>予約は、お客さんがスマホから30秒で完了できる導線に作り込みます</li>
</ul>
<h3>③ 開店・引き渡し</h3>
<ul>
<li>公開の設定</li>
<li>予約や注文が入ったときに、あなたに通知が届く設定</li>
<li>使い方レクチャー（60分）</li>
</ul>
<p>「納品して終わり」ではなく、<span class="sd-strong">自分で予約と注文を受け取れる状態</span>までお渡しします。</p>
<h3>④ 月額運用</h3>
<p>公開したあとが本番です。月額で以下を続けます。</p>
<ul>
<li>テキスト・画像の更新（月2回まで）</li>
<li>予約・売上の月次ミニレポート（「今月何件予約が入ったか」がひと目でわかる）</li>
<li>相談窓口（チャットでいつでも質問OK）</li>
</ul>

<h2>料金（税別）</h2>
<table>
<tr><th>項目</th><th>料金</th><th>備考</th></tr>
<tr><td>初期構築</td><td><strong>20万円〜</strong></td><td>ヒアリング・入口商品の設計・構築・引き渡しまで込み</td></tr>
<tr><td>月額運用</td><td><strong>2万円〜／月</strong></td><td>更新月2回・月次レポート・相談窓口込み。6ヶ月以上の継続をお願いしています（7ヶ月目以降はいつでも解約できます）</td></tr>
<tr><td>別途実費</td><td>—</td><td>プラットフォーム利用料・決済手数料・ドメイン代</td></tr>
</table>
<p><span class="sd-strong">なぜこの価格でできるのか</span></p>
<ul>
<li>AIを活用して、制作の工数を通常の1/2〜1/3に圧縮する作り方をしているため</li>
<li>広告を出さず、ご紹介と相談ベースで仕事をいただいており、営業コストがかからない分を価格に還元しているため</li>
</ul>
<p>安かろう悪かろう、ではありません。工程を公開しているので、<a href="/pages/works">制作事例ページ</a>で作り方そのものをご確認いただけます。</p>

<h2>ご依頼までの流れ</h2>
<ol>
<li><span class="sd-strong">まず無料相談（60分）</span> — オンラインで日時を予約できます。この時点では1円もかかりません</li>
<li><span class="sd-strong">入口商品の設計案とお見積もりをご提示</span> — 内訳つき。持ち帰ってご検討ください</li>
<li><span class="sd-strong">ご納得いただけたら着手</span> — 2〜3週間で開店です</li>
</ol>
<p>見積もりを見てからやめても、もちろん大丈夫です。</p>
${CTA_BLOCK()}
</div>`,
  },
  {
    handle: 'consultation',
    title: '無料相談を予約する（60分）',
    titleTag: '無料相談を予約する（60分）｜すーさんのEC相談所',
    descTag:
      'サイトのこと、売る商品のこと、60分無料でご相談ください。相談だけでOK、こちらから営業は一切しません。30秒で予約できます。',
    body: `${PAGE_CSS}<div class="sd">
<p class="sd-lead">サイトのこと、売る商品のこと、予約の受け方のこと。<br>60分、無料でご相談を受けています。</p>

<h2>3つのお約束</h2>
<ol>
<li><span class="sd-strong">相談だけでOKです。</span>「話を聞いて終わり」で、まったく問題ありません。</li>
<li><span class="sd-strong">こちらから営業しません。</span>相談のあとに売り込みの電話やメールを送ることはありません。次に動くかどうかは、あなたが決めてください。</li>
<li><span class="sd-strong">合わなければ、正直に言います。</span>うちのパッケージが合わない場合は「作らないほうがいい」も含めてお伝えします。</li>
</ol>

<h2>60分でやること</h2>
<ul>
<li>いまの集客・予約の受け方をお聞きします（電話？LINE？紹介だけ？）</li>
<li>「あなたのお店の入口になる商品」の方向性を一緒に整理します</li>
<li>サイトを作る場合・作らない場合、それぞれ何をすればいいかをお伝えします</li>
</ul>
<p>準備はいりません。手ぶらで、いまの状況をそのまま話してください。</p>

<h2>ご希望の日時を選んでください</h2>
<p>下のボタンから空いている日時を選ぶだけで、予約完了です。確定メールが自動で届きます。所要30秒です。</p>
<p style="text-align:center"><a class="sd-btn" href="${TIMEREX_URL}" target="_blank" rel="noopener">空き日程を見て予約する（30秒）</a></p>

<h2>よくある質問</h2>
<h3>Q. 本当に無料ですか？</h3>
<p>A. 無料です。相談のあとに料金が発生することもありません。制作をご依頼いただく場合のみ、事前に内訳つきのお見積もりをお出しします。</p>
<h3>Q. まだ何も決まっていないのですが、相談していいですか？</h3>
<p>A. むしろ「何も決まっていない」段階が一番おすすめです。何を売るかから一緒に考えるのが、この相談所の得意分野です。</p>
<h3>Q. オンラインですか？対面ですか？</h3>
<p>A. 基本はオンライン（ビデオ通話）です。予約確定メールに参加用のリンクが届きます。</p>
<h3>Q. 予約した日時を変更したいときは？</h3>
<p>A. 確定メール内のリンクから変更・キャンセルできます。気兼ねなくどうぞ。</p>
</div>`,
  },
  {
    handle: 'works',
    title: '制作事例・プロフィール',
    titleTag: '制作事例とプロフィール｜すーさんのEC相談所',
    descTag:
      '事例第1号は、いまご覧のこのサイト自体。構成・使った仕組み・制作期間まで、作り方をすべて公開しています。制作者・鈴木のプロフィールもこちら。',
    body: `${PAGE_CSS}<div class="sd">
<h2>事例第1号：このサイト自体です</h2>
<p>「実績はありますか？」と聞かれたら、こう答えます。<br><span class="sd-strong">いまご覧いただいている、このサイトです。</span></p>
<p>お客さまにお作りするパッケージと同じ構成・同じ仕組みで、自分のサイトを作りました。「あなたのお店もこうなります」の実物として、作り方を全部公開します。</p>

<h3>構成</h3>
<pre style="background:#f4f1e8;padding:1em;border-radius:8px;">TOP
├── サービス（商品ページ）
├── 無料相談を予約する（入口商品＝無料相談60分）
└── 制作事例・プロフィール（このページ）</pre>
<p>お客さまのサイトの場合、「無料相談60分」の部分が、あなたのお店の入口商品——たとえば「初回カウンセリング」「体験レッスン」「初回相談60分」——に置き換わります。</p>

<h3>使った仕組み</h3>
<table>
<tr><th>項目</th><th>内容</th><th>選んだ理由</th></tr>
<tr><td>サイト本体</td><td>Shopify</td><td>ページ・商品・決済・予約を1か所で管理でき、引き渡し後にご自身でも更新しやすいため</td></tr>
<tr><td>予約機能</td><td>オンライン予約システム（カレンダー連携）</td><td>お客さまがスマホから30秒で予約でき、確定メールも自動で届くため</td></tr>
<tr><td>商品登録</td><td>「無料相談60分」を予約制の商品として登録</td><td>予約＝商品の入口、という設計をそのまま形にするため</td></tr>
</table>

<h3>制作期間・体制</h3>
<ul>
<li>制作期間：2〜3週間（お客さまにご提示している構築期間と同じ条件で制作）</li>
<li>体制：鈴木1人。AIを活用して、文章作成・コーディングの工数を圧縮</li>
</ul>

<h3>この事例からわかること</h3>
<ul>
<li><span class="sd-strong">予約が入る導線が実際に動いています。</span>疑わしければ、いま無料相談を予約してみてください。それがそのまま、あなたのお客さまが体験する流れです</li>
<li><span class="sd-strong">工程を隠しません。</span>何をどう作るかが見えている制作は、見積もりも判断もしやすいはずです</li>
</ul>
<p style="text-align:center"><a class="sd-btn" href="/pages/consultation">この仕組みを体験する（無料相談を予約）</a></p>

<h2>事例第2号・第3号（準備中）</h2>
<p>現在、モニターとして2社のサイトを制作中です。公開され次第、ここに掲載します。</p>

<h2>プロフィール</h2>
<h3>鈴木（すーさん）</h3>
<p>すーさんのEC相談所 代表。WEBサイトの制作・運用が本業です。東京在住。</p>
<p><span class="sd-strong">経歴</span></p>
<ul>
<li>WEBサイトの制作・運用歴 10年</li>
<li>企業サイト・ECサイト・ランディングページなど、業種を問わず幅広い制作・運用を担当。現在も複数の企業サイトの運用に携わる</li>
</ul>
<p><span class="sd-strong">制作スタイル</span></p>
<ul>
<li><span class="sd-strong">相談から入る。</span>作る前に「何を売るか」を一緒に決めます。ここを飛ばしたサイトは、きれいでも売れないからです</li>
<li><span class="sd-strong">AIで工数を圧縮し、価格に還元する。</span>文章作成・コーディングにAIを組み込んだ制作体制で、通常の1/2〜1/3の工数で作ります。浮いた分は料金を下げることに使っています</li>
<li><span class="sd-strong">渡したあとも見る。</span>サイトは公開してからが本番。月額運用で、更新もレポートも相談も引き受けます</li>
</ul>
<p><span class="sd-strong">好きなもの</span></p>
<p>読書。週に1冊のペースで、ジャンルを問わず読んでいます。相談の場でも、たまに本の話が出ます。</p>

${CTA_BLOCK()}
</div>`,
  },
];

async function stepPages() {
  const { pages: existing } = await get('pages.json?limit=250&fields=id,title,handle');
  for (const def of PAGES) {
    const found = existing.find((p) => p.handle === def.handle);
    let pageId;
    if (found) {
      await put(`pages/${found.id}.json`, {
        page: { id: found.id, title: def.title, body_html: def.body, published: true },
      });
      pageId = found.id;
      console.log(`♻️ 更新: /pages/${def.handle}`);
    } else {
      const { page } = await post('pages.json', {
        page: { title: def.title, handle: def.handle, body_html: def.body, published: true },
      });
      pageId = page.id;
      console.log(`✅ 作成: /pages/${def.handle}`);
    }
    // SEO（title_tag / description_tag）
    const { metafields } = await get(`pages/${pageId}/metafields.json`);
    for (const [key, value] of [['title_tag', def.titleTag], ['description_tag', def.descTag]]) {
      const mf = metafields.find((m) => m.namespace === 'global' && m.key === key);
      if (mf) {
        await put(`metafields/${mf.id}.json`, { metafield: { id: mf.id, value } });
      } else {
        await post(`pages/${pageId}/metafields.json`, {
          metafield: { namespace: 'global', key, type: 'single_line_text_field', value },
        });
      }
    }
  }
  console.log('✅ pages 完了');
}

// ---------- nav ----------

const MAIN_MENU_ITEMS = [
  { title: 'ホーム', type: 'FRONTPAGE', url: '/' },
  { title: 'サービスと料金', type: 'HTTP', url: '/pages/services' },
  { title: '無料相談を予約する', type: 'HTTP', url: '/pages/consultation' },
  { title: '制作事例・プロフィール', type: 'HTTP', url: '/pages/works' },
  { title: 'お問い合わせ', type: 'HTTP', url: '/pages/contact' },
];

async function stepNav() {
  const data = await graphql(`{ menus(first: 25) { nodes { id handle title } } }`);
  const main = data.menus.nodes.find((m) => m.handle === 'main-menu') ?? data.menus.nodes[0];
  if (!main) throw new Error('メインメニューが見つかりません');
  const result = await graphql(
    `mutation menuUpdate($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
      menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
        menu { id items { title url } }
        userErrors { field message }
      }
    }`,
    { id: main.id, title: 'メインメニュー', handle: main.handle, items: MAIN_MENU_ITEMS },
  );
  const errs = result.menuUpdate.userErrors;
  if (errs.length) throw new Error(`menuUpdate: ${JSON.stringify(errs)}`);
  console.log(`✅ nav 完了: ${result.menuUpdate.menu.items.map((i) => i.title).join(' / ')}`);
}

// ---------- home ----------

const HOME_CSS = `
{% comment %} すーさんのEC相談所 TOP 共通スタイル {% endcomment %}
<style>
@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
.ss-sec { font-family: 'Noto Sans JP', sans-serif; color: #2a2a2a; padding: 64px 20px; }
.ss-inner { max-width: 900px; margin: 0 auto; }
.ss-h2 { font-family: 'Zen Maru Gothic', sans-serif; color: #1f5b4e; font-size: clamp(1.4rem, 3vw, 1.9rem); line-height: 1.6; margin: 0 0 .9em; }
.ss-h3 { font-family: 'Zen Maru Gothic', sans-serif; color: #1f5b4e; font-size: 1.08rem; margin: 0 0 .4em; }
.ss-p { line-height: 2; margin: 0 0 1em; }
.ss-note { color: #6a6a6a; font-size: .88rem; }
.ss-btn { display: inline-block; background: #1f5b4e; color: #fff !important; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 1rem; }
.ss-btn:hover { opacity: .85; }
.ss-btn--ghost { background: transparent; color: #1f5b4e !important; border: 2px solid #1f5b4e; }
.ss-cards { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin: 1.4em 0; }
.ss-card { background: #fff; border: 1px solid #e2ddd0; border-radius: 12px; padding: 24px; line-height: 1.9; }
.ss-bg-cream { background: #faf9f5; }
.ss-bg-green { background: #1f5b4e; }
.ss-bg-green .ss-h2, .ss-bg-green .ss-p { color: #fff; }
.ss-bg-green .ss-btn { background: #fff; color: #1f5b4e !important; }
.ss-steps { counter-reset: step; display: grid; gap: 14px; margin: 1.4em 0; }
.ss-step { background: #fff; border: 1px solid #e2ddd0; border-radius: 12px; padding: 20px 24px; position: relative; padding-left: 64px; }
.ss-step::before { counter-increment: step; content: counter(step); position: absolute; left: 20px; top: 20px;
  width: 30px; height: 30px; border-radius: 50%; background: #1f5b4e; color: #fff; font-weight: 700;
  display: flex; align-items: center; justify-content: center; font-family: 'Zen Maru Gothic', sans-serif; }
.ss-table { width: 100%; border-collapse: collapse; margin: 1.2em 0; background: #fff; }
.ss-table th, .ss-table td { border: 1px solid #e2ddd0; padding: .9em 1em; text-align: left; }
.ss-table th { background: #f4f1e8; }
.ss-center { text-align: center; }
</style>`;

const HOME_SECTIONS = {
  hero: `${HOME_CSS}
<div class="ss-sec ss-bg-cream ss-center">
  <div class="ss-inner">
    <p class="ss-note" style="letter-spacing:.2em;">すーさんのEC相談所｜相談から、開店まで。</p>
    <h1 class="ss-h2" style="font-size:clamp(1.7rem,4.5vw,2.5rem);">予約も、購入も、<br>あなたのお店のサイトで。</h1>
    <p class="ss-p">売る商品を一緒に決めて、安く早く作り、<br>公開したあとの面倒は、月額でぜんぶ見ます。<br>まずは60分、相談だけでも。</p>
    <a class="ss-btn" href="/pages/consultation">無料相談を予約する（60分・無料）</a>
  </div>
</div>`,
  pains: `
<div class="ss-sec">
  <div class="ss-inner">
    <h2 class="ss-h2 ss-center">こんな方の相談所です</h2>
    <div class="ss-cards">
      <div class="ss-card"><h3 class="ss-h3">予約が必要な商売なのに、WEBから予約が入らない</h3>サロン・教室・飲食店・士業の相談枠など。「電話かLINEだけ」で、取りこぼしていませんか？</div>
      <div class="ss-card"><h3 class="ss-h3">サイトはあるけど、古いまま止まっている</h3>何年も更新していない。スマホで見づらい。自分でも直せない。</div>
      <div class="ss-card"><h3 class="ss-h3">「何を目玉に売ればいいか」から迷っている</h3>サイトを作る前に、まず商品の相談がしたい。</div>
    </div>
    <p class="ss-p ss-center">ひとつでも当てはまったら、相談所の出番です。<br>「サイトを作るかどうか」を決めるのは、話を聞いてからで大丈夫です。</p>
    <p class="ss-center"><a class="ss-btn ss-btn--ghost" href="/pages/consultation">まずは相談してみる</a></p>
  </div>
</div>`,
  flow: `
<div class="ss-sec ss-bg-cream">
  <div class="ss-inner">
    <h2 class="ss-h2 ss-center">相談から、開店まで。4つのステップ</h2>
    <div class="ss-steps">
      <div class="ss-step"><h3 class="ss-h3">相談・ヒアリング</h3>いまの商売のこと、お客さんのこと、じっくり聞かせてください。「お店の入口になる商品」を一緒に決めるところから始めます。</div>
      <div class="ss-step"><h3 class="ss-h3">構築（2〜3週間）</h3>商品ページ・予約機能・決済のそろったサイトを作ります。スマホ対応・基本のSEO対策込み。</div>
      <div class="ss-step"><h3 class="ss-h3">開店・引き渡し</h3>公開設定、予約や注文が届いたときの通知設定まで整えて、使い方も60分でレクチャー。「渡して終わり」にはしません。</div>
      <div class="ss-step"><h3 class="ss-h3">月額運用</h3>公開後のテキスト・画像の更新、毎月のミニレポート、困ったときの相談窓口。面倒はこちらが引き受けます。</div>
    </div>
    <p class="ss-center"><a class="ss-btn ss-btn--ghost" href="/pages/services">サービスの詳細を見る</a></p>
  </div>
</div>`,
  proof: `
<div class="ss-sec">
  <div class="ss-inner ss-center">
    <h2 class="ss-h2">実は、このサイトがその「実物」です</h2>
    <p class="ss-p">いまご覧いただいているこのサイトは、私がお客さまにお作りするものと<strong>同じ構成・同じ仕組み</strong>で作ってあります。</p>
    <p class="ss-p">トップページがあって、サービスの説明があって、<strong>スマホから30秒で予約が完了する</strong>。<br>「あなたのお店のサイトも、こうなります」を、言葉ではなくこのサイト自体でお見せしています。</p>
    <p class="ss-p">どうやって作ったかも、制作事例のページで全部公開しています。</p>
    <a class="ss-btn ss-btn--ghost" href="/pages/works">事例第1号（このサイト）の解説を見る</a>
  </div>
</div>`,
  pricing: `
<div class="ss-sec ss-bg-cream">
  <div class="ss-inner">
    <h2 class="ss-h2 ss-center">料金は、先に言います</h2>
    <table class="ss-table">
      <tr><th>項目</th><th>料金（税別）</th></tr>
      <tr><td>初期構築</td><td><strong>20万円〜</strong></td></tr>
      <tr><td>月額運用</td><td><strong>2万円〜／月</strong></td></tr>
    </table>
    <p class="ss-note">※ドメイン代・プラットフォーム利用料・決済手数料は実費となります。<br>※詳しい内訳はサービスページへ。お見積もりは無料相談のあとに、内訳つきでお出しします。</p>
    <p class="ss-center"><a class="ss-btn ss-btn--ghost" href="/pages/services">料金の内訳を見る</a></p>
  </div>
</div>`,
  closing: `
<div class="ss-sec ss-bg-green ss-center">
  <div class="ss-inner">
    <h2 class="ss-h2">まずは60分、話しませんか</h2>
    <p class="ss-p">相談だけで終わっても、まったく構いません。こちらから営業の連絡もしません。<br>「うちの場合はどうなんだろう」を、一緒に整理する60分です。</p>
    <a class="ss-btn" href="/pages/consultation">無料相談を予約する（60分・無料）</a>
  </div>
</div>`,
};

async function stepHome() {
  const theme = await getMainTheme();

  // 差し替え前に必ずバックアップ
  await stepBackup();

  // 既存index.jsonからカスタムLiquidセクションのtype名を検出（テーマ差異対策）
  const current = JSON.parse((await getAsset(theme.id, 'templates/index.json')).value);
  let liquidType = 'custom-liquid';
  for (const sec of Object.values(current.sections ?? {})) {
    if (sec.settings && 'custom_liquid' in sec.settings) {
      liquidType = sec.type;
      break;
    }
  }
  console.log(`🔎 カスタムLiquidセクションtype: ${liquidType}`);

  const sections = {};
  const order = [];
  for (const [name, liquid] of Object.entries(HOME_SECTIONS)) {
    const id = `ss_${name}`;
    sections[id] = {
      type: liquidType,
      settings: { custom_liquid: liquid },
    };
    order.push(id);
  }
  const template = { sections, order };

  await put(`themes/${theme.id}/assets.json`, {
    asset: { key: 'templates/index.json', value: JSON.stringify(template, null, 2) },
  });
  console.log('✅ home 完了: トップページを6セクション構成に差し替えました');
  console.log(`   確認: https://${STORE}/`);
}

// ---------- main ----------

const step = process.argv[2] ?? 'check';
const steps = {
  check: stepCheck,
  backup: stepBackup,
  products: stepProducts,
  pages: stepPages,
  nav: stepNav,
  home: stepHome,
  async all() {
    await stepBackup();
    await stepProducts();
    await stepPages();
    await stepNav();
    await stepHome();
    console.log('\n🎉 全ステップ完了！');
    console.log('   残る手作業: 設定→ストア詳細でストア名を「すーさんのEC相談所」に変更');
    console.log(`   確認URL: https://${STORE}/`);
  },
};

if (!steps[step]) {
  console.error(`❌ 不明なステップ: ${step}（check|backup|products|pages|nav|home|all）`);
  process.exit(1);
}
steps[step]().catch((e) => {
  console.error('❌ 失敗:', e.message);
  process.exit(1);
});
