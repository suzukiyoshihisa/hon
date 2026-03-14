import { writeFile } from 'fs/promises';
import { join } from 'path';

const HEADERS = [
  'ファイル名',
  '日付',
  '支払先',
  '金額（税込）',
  '消費税額',
  '金額（税抜）',
  '支払方法',
  '勘定科目',
  '摘要',
  '信頼度',
  'エラー',
];

/**
 * CSVセルの値をエスケープする
 */
function escapeCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * 解析結果の配列からCSVファイルを生成する
 * BOM付きUTF-8 / CRLF改行（Google Sheets・Excel両対応）
 *
 * @param {Array<{ fileName: string, result: object|null, error: string|null }>} rows
 * @param {string} outputDir
 * @param {number|string} year
 * @returns {Promise<string>} 出力ファイルのパス
 */
export async function writeCsv(rows, outputDir, year) {
  const today = new Date();
  const dateSuffix = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('');
  const fileName = `${year}_receipts_${dateSuffix}.csv`;
  const outputPath = join(outputDir, fileName);

  const lines = [HEADERS.map(escapeCell).join(',')];

  for (const { fileName: imgFile, result, error } of rows) {
    if (error && !result) {
      // 解析自体が失敗した行
      const cells = [
        imgFile, '', '', '', '', '', '', '', '', 'low', error,
      ];
      lines.push(cells.map(escapeCell).join(','));
      continue;
    }

    const amount = Number(result.amount) || 0;
    const tax = Number(result.tax_amount) || 0;
    const amountExTax = amount - tax;

    const cells = [
      imgFile,
      result.date || '',
      result.store_name || '',
      amount || '',
      tax || '',
      amountExTax >= 0 ? amountExTax : '',
      result.payment_method || '',
      result.category || '',
      result.memo || '',
      result.confidence || '',
      result.error || error || '',
    ];
    lines.push(cells.map(escapeCell).join(','));
  }

  // BOM付きUTF-8 + CRLF
  const bom = '\uFEFF';
  const content = bom + lines.join('\r\n') + '\r\n';
  await writeFile(outputPath, content, 'utf8');

  return outputPath;
}
