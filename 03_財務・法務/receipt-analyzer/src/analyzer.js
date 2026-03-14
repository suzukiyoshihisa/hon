import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import { normalizeCategory, getAccountNames } from './classifier.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL_MAP = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
};

/**
 * レシート画像をClaude Vision APIで解析する
 * @param {{ base64: string, mediaType: string, fileName: string }} image
 * @param {'haiku'|'sonnet'} modelAlias
 * @returns {Promise<object>} 解析結果
 */
export async function analyzeReceipt(image, modelAlias = 'haiku') {
  const model = MODEL_MAP[modelAlias] || MODEL_MAP.haiku;
  const accountList = getAccountNames().join(' / ');

  const prompt = `あなたは日本の経費精算の専門家です。
このレシート・領収書の画像を解析し、以下のJSONを返してください。

## 出力フォーマット（JSONのみ）
{
  "date": "日付（YYYY-MM-DD形式。不明な場合は空文字）",
  "store_name": "支払先・店舗名（不明な場合は空文字）",
  "amount": 金額税込（数値のみ、円マーク不要。不明な場合は0）,
  "tax_amount": 消費税額（数値のみ。不明または記載なしの場合は0）,
  "payment_method": "支払方法（現金/クレジットカード/電子マネー/QRコード/銀行振込/不明）",
  "category": "勘定科目（以下から最も適切なものを1つ選択）",
  "memo": "品目・摘要（簡潔に30文字以内）",
  "confidence": "解析の信頼度（high/medium/low）",
  "error": "エラーメッセージ（問題なければ空文字）"
}

## 選択可能な勘定科目
${accountList}

## 信頼度の基準
- high: 日付・金額・支払先が明確に読み取れる
- medium: 一部が読み取りづらいが主要情報は取得できた
- low: 画像が不鮮明、または必須情報が欠落している

JSONのみ返してください。`;

  const response = await client.messages.create({
    model,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.mediaType,
              data: image.base64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const raw = parseJson(response.content[0].text);
  raw.category = normalizeCategory(raw.category);
  return raw;
}

function parseJson(text) {
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* fallback */ }
  }
  const bareMatch = text.match(/\{[\s\S]*\}/);
  if (bareMatch) {
    try { return JSON.parse(bareMatch[0]); } catch { /* fallback */ }
  }
  throw new Error('Claude APIのレスポンスからJSONを抽出できませんでした:\n' + text.substring(0, 500));
}
