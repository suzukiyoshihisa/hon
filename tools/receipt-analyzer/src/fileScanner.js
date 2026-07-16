import { readdir, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']);

const MEDIA_TYPE_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.gif': 'image/gif',
};

/**
 * 指定フォルダ内の画像ファイルを列挙する（サブフォルダは走査しない）
 * @param {string} folderPath
 * @returns {Promise<string[]>} ファイルパスの配列（ソート済み）
 */
export async function scanImageFiles(folderPath) {
  let entries;
  try {
    entries = await readdir(folderPath, { withFileTypes: true });
  } catch {
    throw new Error(`フォルダが見つかりません: ${folderPath}`);
  }

  const files = entries
    .filter(e => e.isFile() && SUPPORTED_EXTENSIONS.has(extname(e.name).toLowerCase()))
    .map(e => join(folderPath, e.name))
    .sort();

  return files;
}

/**
 * 画像ファイルをBase64エンコードして返す
 * @param {string} filePath
 * @returns {Promise<{ base64: string, mediaType: string, fileName: string }>}
 */
export async function readImageAsBase64(filePath) {
  const buf = await readFile(filePath);
  const ext = extname(filePath).toLowerCase();
  const mediaType = MEDIA_TYPE_MAP[ext] || 'image/jpeg';
  return {
    base64: buf.toString('base64'),
    mediaType,
    fileName: basename(filePath),
  };
}
