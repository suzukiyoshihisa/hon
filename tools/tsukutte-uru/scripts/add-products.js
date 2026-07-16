/**
 * add-products.js
 * HON商店 デモ商品 3点を追加
 *
 * 実行: node --env-file=.env scripts/add-products.js
 *
 * 追加商品:
 *   1. 無料相談予約        — 予約・サービス販売導線のサンプル
 *   2. 商品企画ミニ相談    — 有料相談商品のサンプル
 *   3. ブランド診断シート  — ダウンロード商品のサンプル
 */

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!STORE || !TOKEN) {
  console.error('❌ SHOPIFY_STORE と SHOPIFY_ACCESS_TOKEN が必要です');
  process.exit(1);
}

const BASE = `https://${STORE}/admin/api/2024-01`;
const HEADERS = {
  'X-Shopify-Access-Token': TOKEN,
  'Content-Type': 'application/json',
};

async function shopifyGet(path) {
  const res = await fetch(`${BASE}/${path}`, { headers: HEADERS });
  const json = await res.json();
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} - ${JSON.stringify(json.errors ?? json)}`);
  return json;
}

async function shopifyPost(path, body) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`POST ${path}: ${res.status} - ${JSON.stringify(json.errors ?? json)}`);
  return json;
}

// 既存商品のタイトルを確認して重複を避ける
async function getExistingProductTitles() {
  const { products } = await shopifyGet('products.json?limit=250&fields=id,title');
  return new Set(products.map((p) => p.title));
}

// 新商品の定義
const NEW_PRODUCTS = [
  {
    title: '無料相談予約',
    body_html: `<p>自社商品づくり・OEM・EC販売について、<strong>30分の無料相談</strong>をご利用いただけます。</p>
<p>商品がまだ決まっていなくても大丈夫です。現在の状況に合わせて、最初の一歩を一緒に整理します。</p>
<h3>こんな方におすすめ</h3>
<ul>
  <li>オリジナル商品を作りたいが何から始めればよいかわからない</li>
  <li>今ある商品をネットで売る方法を知りたい</li>
  <li>OEMや製造についてざっくり聞いてみたい</li>
  <li>Shopifyを使うべきか、他のプラットフォームがよいか迷っている</li>
</ul>
<p><small>※ 購入後に日程調整のご連絡をお送りします。Zoomまたはお電話にて対応します。</small></p>`,
    vendor: 'HON商店',
    product_type: 'サービス・相談',
    tags: 'おすすめ, 相談, 無料',
    status: 'active',
    variants: [
      {
        price: '0.00',
        requires_shipping: false,
        taxable: false,
        inventory_management: null,
        sku: 'HON-CONSULT-FREE',
      },
    ],
  },
  {
    title: '商品企画ミニ相談',
    body_html: `<p>作りたい商品の方向性を一緒に整理する、<strong>60分の有料相談</strong>です。</p>
<p>「こんな商品を作りたい」という段階から、ターゲット・価格・販売方法まで具体化します。相談後に議事録と次のアクションリストをお渡しします。</p>
<h3>セッション内容</h3>
<ul>
  <li>商品コンセプトの整理（誰に・何を・いくらで）</li>
  <li>OEM・製造方法の方向性確認</li>
  <li>販売チャネル（Shopify・Amazon・店舗など）の検討</li>
  <li>次のアクションの明確化</li>
</ul>
<p><small>※ 購入後にフォームをお送りします。事前にヒアリングシートをご記入いただきます。</small></p>`,
    vendor: 'HON商店',
    product_type: 'サービス・相談',
    tags: 'おすすめ, 相談, 有料相談, 商品企画',
    status: 'active',
    variants: [
      {
        price: '30000',
        requires_shipping: false,
        taxable: true,
        inventory_management: null,
        sku: 'HON-CONSULT-MINI',
      },
    ],
  },
  {
    title: 'ブランド診断シート',
    body_html: `<p>自社商品・ブランドの現状を整理するための<strong>無料診断シート（PDFダウンロード）</strong>です。</p>
<p>「商品はあるが売れていない」「ブランドのコンセプトが曖昧」という方が、自分のブランドの強みと課題を可視化するためのワークシートです。</p>
<h3>シートの内容</h3>
<ul>
  <li>ターゲット顧客の整理（5項目）</li>
  <li>競合・差別化ポイントの確認（3項目）</li>
  <li>商品の見せ方チェックリスト（10項目）</li>
  <li>EC販売準備度チェック（8項目）</li>
</ul>
<p>記入後、無料相談にお申し込みいただくと、シートをもとにアドバイスします。</p>
<p><small>※ 購入完了後にダウンロードリンクをお送りします。</small></p>`,
    vendor: 'HON商店',
    product_type: 'デジタルコンテンツ',
    tags: 'おすすめ, デジタルコンテンツ, ダウンロード, ブランド診断',
    status: 'active',
    variants: [
      {
        price: '0.00',
        requires_shipping: false,
        taxable: false,
        inventory_management: null,
        sku: 'HON-BRAND-SHEET-001',
      },
    ],
  },
];

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' HON商店 デモ商品追加スクリプト');
  console.log(`  ストア: ${STORE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.stdout.write('1. 既存商品を確認... ');
  const existingTitles = await getExistingProductTitles();
  console.log(`✓ ${existingTitles.size}件の商品が存在`);

  let added = 0;
  let skipped = 0;

  for (const productData of NEW_PRODUCTS) {
    if (existingTitles.has(productData.title)) {
      console.log(`   スキップ: "${productData.title}" は既に存在します`);
      skipped++;
      continue;
    }

    process.stdout.write(`   追加中: "${productData.title}"... `);
    const { product } = await shopifyPost('products.json', { product: productData });
    console.log(`✓ ID: ${product.id}`);
    added++;
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` ✅ 完了！ 追加: ${added}件 / スキップ: ${skipped}件`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((err) => {
  console.error(`❌ エラー: ${err.message}`);
  process.exit(1);
});
