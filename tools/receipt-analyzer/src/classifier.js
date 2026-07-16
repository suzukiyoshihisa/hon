/**
 * 日本の標準勘定科目（費用科目）定義
 * key: 正規化後の科目名
 * aliases: Claudeの出力に含まれうる表現
 */
const ACCOUNTS = [
  { name: '交通費',       aliases: ['交通費', '電車', 'バス', 'タクシー', 'ic', 'suica', 'pasmo'] },
  { name: '旅費交通費',   aliases: ['旅費', '出張', '宿泊', 'ホテル', '新幹線', '航空', '飛行機'] },
  { name: '接待交際費',   aliases: ['接待', '交際費', '贈答', 'ギフト', '手土産', '慶弔'] },
  { name: '会議費',       aliases: ['会議費', 'ミーティング', '打ち合わせ', 'カフェ', 'コーヒー', '喫茶'] },
  { name: '消耗品費',     aliases: ['消耗品', '文具', '事務用品', 'コピー用紙', 'インク', 'トナー', '電池'] },
  { name: '通信費',       aliases: ['通信費', '電話', '携帯', 'スマホ', 'インターネット', 'wifi', '郵便', '切手'] },
  { name: '広告宣伝費',   aliases: ['広告', '宣伝', '広報', 'チラシ', 'ポスター', 'sns', '名刺'] },
  { name: '新聞図書費',   aliases: ['新聞', '図書', '書籍', '雑誌', 'books', '本', 'kindle'] },
  { name: '研修費',       aliases: ['研修', 'セミナー', '講習', '勉強会', '資格'] },
  { name: '地代家賃',     aliases: ['家賃', '地代', '賃料', 'rent', 'レンタル', 'リース'] },
  { name: '水道光熱費',   aliases: ['電気', 'ガス', '水道', '光熱費'] },
  { name: '福利厚生費',   aliases: ['福利厚生', '健康診断', 'スポーツ', 'フィットネス', '社員'] },
  { name: '外注費',       aliases: ['外注', '業務委託', 'フリーランス', '下請け'] },
  { name: '支払手数料',   aliases: ['手数料', '振込', '送金', '決済', 'stripe', 'paypal'] },
  { name: '雑費',         aliases: ['雑費', 'その他', '雑', 'misc'] },
];

const FALLBACK = '不明';

/**
 * Claudeが返した勘定科目文字列を正規化する
 * - 完全一致 → そのまま
 * - 部分一致（エイリアス） → 正規名
 * - どれにも合わない → '不明'
 * @param {string} raw
 * @returns {string}
 */
export function normalizeCategory(raw) {
  if (!raw || typeof raw !== 'string') return FALLBACK;
  const normalized = raw.trim().toLowerCase();

  // 完全一致
  const exact = ACCOUNTS.find(a => a.name === raw.trim());
  if (exact) return exact.name;

  // エイリアス部分一致
  for (const account of ACCOUNTS) {
    for (const alias of account.aliases) {
      if (normalized.includes(alias.toLowerCase())) {
        return account.name;
      }
    }
  }

  return FALLBACK;
}

/**
 * 利用可能な勘定科目一覧を返す
 */
export function getAccountNames() {
  return ACCOUNTS.map(a => a.name).concat([FALLBACK]);
}
