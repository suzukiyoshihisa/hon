import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * 会員データからテンプレートタイプを選択する（Haiku使用）
 */
export async function selectTemplate(memberData) {
  const prompt = `以下のBNI会員情報を見て、最適なウェブサイトテンプレートを選んでください。

会員情報:
- 氏名: ${memberData.name}
- 職業/肩書: ${memberData.profession}
- 会社名: ${memberData.company}
- 自己紹介: ${memberData.bio?.substring(0, 200)}

選択肢:
- "lp": 個人事業主・フリーランス・士業など個人で活動している方向け（シンプルなLP）
- "corporate": 法人・複数スタッフ・サービスが複数ある事業者向け（コーポレートサイト）

"lp" または "corporate" のどちらか一方だけを回答してください。`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim().toLowerCase();
  return text.includes('corporate') ? 'corporate' : 'lp';
}

/**
 * 会員データからカラーテーマと画像検索キーワードを生成する（Haiku使用）
 * 日本人/アジア人の写真を優先し、ない場合は顔の見えないシーン写真を使う
 */
export async function generateTheme(memberData) {
  const professionHint = memberData.profession || memberData.pageRawText?.substring(0, 300) || '';
  const bioHint = memberData.bio?.substring(0, 200) || '';

  const prompt = `以下のBNI会員情報から、ウェブサイトのカラーテーマと画像検索キーワードをJSONで生成してください。

職業: ${professionHint}
自己紹介: ${bioHint}

## 出力フォーマット（JSONのみ）
{
  "COLOR_PRIMARY": "メインカラー（hex）",
  "COLOR_ACCENT": "アクセントカラー（メインより明るい同系色、hex）",
  "COLOR_LIGHT": "背景用の淡い色（白に近いhex）",
  "COLOR_DARK": "テキスト・ダーク背景用の暗い色（hex）",
  "HERO_IMAGE_QUERY": "日本人女性または日本的なシーンの英語検索（例: Japanese woman spa wellness）",
  "HERO_IMAGE_FALLBACK": "顔が映らない関連シーン・インテリアの英語検索（例: spa interior candles flowers）",
  "SERVICE_1_IMAGE_QUERY": "日本人/アジア人が映ったサービス画像の英語検索（例: Asian woman massage therapy）",
  "SERVICE_1_IMAGE_FALLBACK": "顔が映らない関連ツール・環境の英語検索（例: massage oil stones tools）",
  "SERVICE_2_IMAGE_QUERY": "日本人/アジア人が映ったサービス画像の英語検索",
  "SERVICE_2_IMAGE_FALLBACK": "顔が映らない関連ツール・環境の英語検索",
  "SERVICE_3_IMAGE_QUERY": "日本人/アジア人が映ったサービス画像の英語検索",
  "SERVICE_3_IMAGE_FALLBACK": "顔が映らない関連ツール・環境の英語検索"
}

## カラー選定の指針
- ケア・マッサージ・美容・エステ: ウォームカラー（ローズ、ピーチ、テラコッタ系）
- 医療・健康・整体: 清潔感のある色（ティール、ライトグリーン、清楚なブルー）
- IT・技術・エンジニア: クールブルー、インディゴ、パープル
- 金融・士業・会計: 信頼感のあるネイビー、ゴールド、ディープグリーン
- 飲食・食品: 食欲を刺激するウォームレッド、オレンジ、ブラウン
- クリエイティブ・デザイン: 鮮やかなビビッドカラー

JSONのみ返してください。`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  return parseJson(response.content[0].text);
}

/**
 * 会員データからサイトコンテンツJSONを生成する（Sonnet使用）
 */
export async function generateContent(memberData, templateType) {
  const isCorporate = templateType === 'corporate';

  const prompt = `あなたはプロのウェブコピーライターです。
以下のBNI会員情報をもとに、魅力的なウェブサイトのコンテンツをJSON形式で生成してください。

## 会員情報
${JSON.stringify(memberData, null, 2)}

## 生成するJSONのフォーマット
\`\`\`json
{
  "PAGE_TITLE": "ページタイトル（60文字以内）",
  "META_DESCRIPTION": "メタディスクリプション（120文字以内）",
  "MEMBER_NAME": "会員の氏名",
  "PROFESSION": "職業・肩書き",
  "COMPANY_NAME": "会社・屋号名",
  "TAGLINE": "キャッチコピー（20文字以内）",
  "HERO_SUBTEXT": "ヒーロー下部のサブテキスト（50文字以内）",
  "PROFILE_IMAGE_URL": "プロフィール画像URL（なければ空文字）",
  "STRENGTH_1_TITLE": "強み1のタイトル",
  "STRENGTH_1_TEXT": "強み1の説明（60文字以内）",
  "STRENGTH_2_TITLE": "強み2のタイトル",
  "STRENGTH_2_TEXT": "強み2の説明（60文字以内）",
  "STRENGTH_3_TITLE": "強み3のタイトル",
  "STRENGTH_3_TEXT": "強み3の説明（60文字以内）",
  "SERVICE_1_NAME": "サービス1の名前",
  "SERVICE_1_DESC": "サービス1の説明（80文字以内）",
  "SERVICE_2_NAME": "サービス2の名前",
  "SERVICE_2_DESC": "サービス2の説明（80文字以内）",
  "SERVICE_3_NAME": "サービス3の名前",
  "SERVICE_3_DESC": "サービス3の説明（80文字以内）",
  "ABOUT_TITLE": "プロフィールセクションのタイトル",
  "ABOUT_TEXT": "自己紹介文（150文字以内）",
  "PROFILE_CAREER": "経歴・実績（100文字以内）",
  "CTA_HEADLINE": "CTAの見出し（30文字以内）",
  "CTA_SUBTEXT": "CTAのサブテキスト（60文字以内）",
  "CTA_BUTTON_TEXT": "CTAボタンのテキスト（15文字以内）",
  "PHONE": "電話番号",
  "EMAIL": "メールアドレス",
  "WEBSITE_URL": "ウェブサイトURL",
  "LOCATION": "所在地・活動エリア",
  "PRICING": [
    {
      "name": "フロント商品名（お試し・体験コース）",
      "price": "¥X,XXX",
      "description": "説明文（40文字以内）",
      "features": ["特徴1", "特徴2", "特徴3"],
      "highlight": false,
      "tag": "まずはこちら"
    },
    {
      "name": "メイン商品名（定番・人気コース）",
      "price": "¥XX,XXX",
      "description": "説明文（40文字以内）",
      "features": ["特徴1", "特徴2", "特徴3", "特徴4"],
      "highlight": true,
      "tag": "人気No.1"
    },
    {
      "name": "プレミアム商品名（VIP・完全サポート）",
      "price": "¥XXX,XXX",
      "description": "説明文（40文字以内）",
      "features": ["特徴1", "特徴2", "特徴3", "特徴4", "特徴5"],
      "highlight": false,
      "tag": "フルサポート"
    }
  ],
  "EC_PRODUCTS": [
    {
      "name": "商品名（職業に関連した購入可能な商品・グッズ）",
      "price": "¥X,XXX",
      "description": "商品説明（40文字以内）",
      "image_query": "product image English 3-4 words"
    },
    { "name": "商品名2", "price": "¥X,XXX", "description": "説明2", "image_query": "query2" },
    { "name": "商品名3", "price": "¥X,XXX", "description": "説明3", "image_query": "query3" },
    { "name": "商品名4", "price": "¥X,XXX", "description": "説明4", "image_query": "query4" }
  ],
  "TESTIMONIALS": [
    {
      "name": "推薦者の氏名",
      "company": "推薦者の所属・BNIチャプター名",
      "text": "推薦文（pageRawTextから抽出、原文ママ・200文字以内）"
    }
  ]${isCorporate ? `,
  "ACHIEVEMENT_1": "実績・受賞歴1",
  "ACHIEVEMENT_2": "実績・受賞歴2",
  "ACHIEVEMENT_3": "実績・受賞歴3",
  "FAQ_1_Q": "よくある質問1",
  "FAQ_1_A": "回答1（80文字以内）",
  "FAQ_2_Q": "よくある質問2",
  "FAQ_2_A": "回答2（80文字以内）",
  "FAQ_3_Q": "よくある質問3",
  "FAQ_3_A": "回答3（80文字以内）"` : ''}
}
\`\`\`

## 注意事項
- PRICING: pageRawTextに料金情報があれば使用し、なければ業界標準的な価格でフロント〜プレミアムを設計する
- EC_PRODUCTS: 職業・サービスに関連した商品・グッズ4件をサンプルとして作成する
- TESTIMONIALS: pageRawTextから推薦文を抽出。なければ空配列 []
- 日本語で生成（英語の会員なら英語でも可）
- HTMLタグ不要
- JSONのみ返してください`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });

  return parseJson(response.content[0].text);
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
