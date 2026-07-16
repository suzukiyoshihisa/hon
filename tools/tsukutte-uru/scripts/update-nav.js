/**
 * update-nav.js
 * HON商店 ナビゲーション更新スクリプト
 *
 * 実行: node --env-file=.env scripts/update-nav.js
 *
 * 変更内容:
 *   ヘッダー: ホーム / サービス内容 / 商品・デモ / 相談予約 / お問い合わせ
 *   フッター: ポリシー4種 + お問い合わせ（現状維持）
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

// GraphQL クライアント（メニュー操作は GraphQL Admin API を使用）
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

// REST でメニューを取得
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

// 目標のヘッダーメニュー構成
const TARGET_HEADER_MENU = [
  { title: 'ホーム',          url: '/' },
  { title: 'サービス内容',    url: '/#hon-services' },
  { title: '商品・デモ',      url: '/collections/all' },
  { title: '相談予約',        url: '/pages/schedule' },
  { title: 'お問い合わせ',    url: '/pages/contact' },
];

async function updateMenuByHandle(handle, newItems) {
  // REST APIでメニューを検索
  const { menus } = await shopifyGet('menus.json');
  const menu = menus.find((m) => m.handle === handle);

  if (!menu) {
    console.log(`   ⚠ メニュー "${handle}" が見つかりません。スキップします。`);
    return null;
  }

  const items = newItems.map((item, i) => ({
    title: item.title,
    url: item.url,
    position: i + 1,
    type: item.url.startsWith('/pages/') ? 'page' : 'http',
  }));

  const { menu: updated } = await shopifyPut(`menus/${menu.id}.json`, {
    menu: { id: menu.id, items },
  });
  return updated;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' HON商店 ナビゲーション更新スクリプト');
  console.log(`  ストア: ${STORE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 現在のメニュー一覧を確認
  process.stdout.write('1. 現在のメニューを確認... ');
  const { menus } = await shopifyGet('menus.json');
  console.log(`✓ ${menus.length}件のメニュー`);
  menus.forEach((m) => console.log(`   - "${m.title}" (handle: ${m.handle})`));

  // ヘッダーメニューを更新
  console.log('');
  process.stdout.write('2. ヘッダーメニューを更新... ');
  // handle は 'main-menu' または 'header' が一般的
  const headerHandle = menus.find((m) =>
    ['main-menu', 'header', 'main'].includes(m.handle),
  )?.handle ?? 'main-menu';

  const updated = await updateMenuByHandle(headerHandle, TARGET_HEADER_MENU);
  if (updated) {
    console.log(`✓ "${updated.title}" を更新`);
    updated.items?.forEach((item) => console.log(`   - ${item.title}: ${item.url}`));
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' ✅ ナビゲーション更新完了！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(' 📝 注意:');
  console.log('    - スクロールアンカーリンク (/#hon-services) はテーマエディターで');
  console.log('      動作確認してください');
}

main().catch((err) => {
  console.error(`❌ エラー: ${err.message}`);
  process.exit(1);
});
