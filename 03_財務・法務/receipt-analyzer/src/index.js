import 'dotenv/config';
import minimist from 'minimist';
import { join, resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { scanImageFiles, readImageAsBase64 } from './fileScanner.js';
import { analyzeReceipt } from './analyzer.js';
import { writeCsv } from './csvWriter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const HELP = `
使い方:
  ./run.sh /path/to/receipts/2026
  ./run.sh /path/to/receipts/2026 --model sonnet   # 精度重視（手書きレシート等）
  ./run.sh /path/to/receipts/2026 --dry-run        # ファイル一覧確認のみ

  node src/index.js --year 2026
  node src/index.js --folder /path/to/folder

オプション:
  --model    使用モデル（haiku[デフォルト] / sonnet）
  --dry-run  ファイル検出のみ（APIは呼び出さない）
  --help     このヘルプを表示
`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = minimist(process.argv.slice(2), {
    boolean: ['dry-run', 'help', 'h'],
    string: ['year', 'y', 'folder', 'f', 'model'],
  });

  if (args.help || args.h) {
    console.log(HELP);
    process.exit(0);
  }

  // フォルダ指定: 位置引数（最初の引数）> --folder/-f > --year/-y
  const positional = args._[0];
  const folderArg = positional || args.folder || args.f;
  const yearArg = args.year || args.y;
  const modelAlias = (args.model || 'haiku').toLowerCase() === 'sonnet' ? 'sonnet' : 'haiku';
  const isDryRun = args['dry-run'];

  if (!folderArg && !yearArg) {
    console.error('エラー: フォルダパスを指定してください。');
    console.error('例: ./run.sh /path/to/receipts/2026');
    process.exit(1);
  }

  if (!isDryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error('エラー: .env に ANTHROPIC_API_KEY を設定してください');
    process.exit(1);
  }

  const targetFolder = folderArg
    ? resolve(folderArg)
    : join(ROOT, 'receipts', String(yearArg));

  // フォルダ名から年を自動検出（例: "2026" → 2026, "receipts_2026" → 2026）
  const folderName = basename(targetFolder);
  const yearMatch = folderName.match(/\d{4}/);
  const year = yearArg || (yearMatch ? yearMatch[0] : folderName);

  const outputDir = join(ROOT, 'output');

  // Step 1: ファイルスキャン
  console.log(`\n🔍 Step 1: レシート画像をスキャン中...`);
  console.log(`   フォルダ: ${targetFolder}`);

  let files;
  try {
    files = await scanImageFiles(targetFolder);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('   対象ファイルが見つかりませんでした。');
    console.log(`   ${targetFolder} に画像（jpg/jpeg/png/webp/heic/gif）を置いてください。`);
    process.exit(0);
  }

  console.log(`   ${files.length} 件の画像を検出しました:`);
  files.forEach((f, i) => console.log(`   ${String(i + 1).padStart(3, ' ')}. ${f.split('/').pop()}`));

  if (isDryRun) {
    console.log('\n✅ dry-run 完了（APIは呼び出しませんでした）');
    process.exit(0);
  }

  // Step 2: API解析（直列・1秒スリープ）
  const modelLabel = modelAlias === 'sonnet' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
  console.log(`\n🤖 Step 2: Claude Vision APIで解析中... (モデル: ${modelLabel})`);

  const rows = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const fileName = filePath.split('/').pop();
    process.stdout.write(`   [${i + 1}/${files.length}] ${fileName} ... `);

    try {
      const image = await readImageAsBase64(filePath);
      const result = await analyzeReceipt(image, modelAlias);
      rows.push({ fileName, result, error: null });
      console.log(`✓ (${result.confidence}) ${result.store_name || '支払先不明'} ¥${result.amount || '-'}`);
      successCount++;
    } catch (err) {
      console.log(`✗ エラー: ${err.message}`);
      rows.push({ fileName, result: null, error: err.message });
      errorCount++;
    }

    if (i < files.length - 1) {
      await sleep(1000);
    }
  }

  // Step 3: CSV出力
  console.log(`\n📄 Step 3: CSVを生成中...`);
  const outputPath = await writeCsv(rows, outputDir, year || 'receipts');
  console.log(`   出力先: ${outputPath}`);

  // サマリー
  console.log(`\n✅ 完了！`);
  console.log(`   解析成功: ${successCount} 件`);
  if (errorCount > 0) console.log(`   エラー:   ${errorCount} 件（CSVに記録済み）`);
  console.log(`\n   Google Sheetsへインポート:`);
  console.log(`   ファイル > インポート > アップロード > ${outputPath.split('/').pop()}`);
}

main().catch(err => {
  console.error('\n❌ 予期せぬエラー:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
