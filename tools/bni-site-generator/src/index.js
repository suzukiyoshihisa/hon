import 'dotenv/config';
import minimist from 'minimist';
import { scrapeMemberPage } from './scraper.js';
import { selectTemplate, generateTheme, generateContent } from './analyzer.js';
import { generateSite } from './generator.js';
import { fetchImage } from './images.js';

const args = minimist(process.argv.slice(2));

async function main() {
  const url = args.url || args.u;

  if (!url) {
    console.error('使い方: node src/index.js --url "https://www.bniconnectglobal.com/..."');
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('エラー: .env に ANTHROPIC_API_KEY を設定してください');
    process.exit(1);
  }
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️  UNSPLASH_ACCESS_KEY が未設定です。画像なしで生成します。');
  }

  try {
    // Step 1: スクレイピング
    console.log('\n📡 Step 1/5: BNI会員ページを取得中...');
    const memberData = await scrapeMemberPage(url);
    console.log(`   会員名: ${memberData.name || '(取得できませんでした)'}`);
    console.log(`   職業: ${memberData.profession || '(取得できませんでした)'}`);

    // Step 2: テンプレート選択 + カラーテーマ生成（並列）
    console.log('\n🎨 Step 2/5: テンプレートとカラーテーマを生成中...');
    const [templateType, theme] = await Promise.all([
      selectTemplate(memberData),
      generateTheme(memberData),
    ]);
    console.log(`   テンプレート: ${templateType}`);
    console.log(`   メインカラー: ${theme.COLOR_PRIMARY}`);

    // Step 3: コンテンツ生成（料金・EC商品・推薦を含む）
    console.log('\n🤖 Step 3/5: AIコンテンツを生成中...');
    const siteContent = await generateContent(memberData, templateType);
    const testimonialCount = Array.isArray(siteContent.TESTIMONIALS) ? siteContent.TESTIMONIALS.length : 0;
    const pricingCount = Array.isArray(siteContent.PRICING) ? siteContent.PRICING.length : 0;
    const ecCount = Array.isArray(siteContent.EC_PRODUCTS) ? siteContent.EC_PRODUCTS.length : 0;
    console.log(`   コンテンツ生成完了 (${Object.keys(siteContent).length}項目)`);
    console.log(`   推薦の声: ${testimonialCount}件 / 料金プラン: ${pricingCount}件 / EC商品: ${ecCount}件`);

    // Step 4: 全画像を並列取得（MV・サービス・EC商品）
    console.log('\n🖼️  Step 4/5: 画像を取得中...');
    const ecProducts = Array.isArray(siteContent.EC_PRODUCTS) ? siteContent.EC_PRODUCTS : [];
    const ecImageFetches = ecProducts.map(p =>
      fetchImage(
        `${p.image_query || 'beauty wellness product'} Japanese`,
        p.image_query || 'beauty product'
      )
    );

    const [heroImg, svc1Img, svc2Img, svc3Img, ...ecImgs] = await Promise.all([
      fetchImage(theme.HERO_IMAGE_QUERY, theme.HERO_IMAGE_FALLBACK),
      fetchImage(theme.SERVICE_1_IMAGE_QUERY, theme.SERVICE_1_IMAGE_FALLBACK),
      fetchImage(theme.SERVICE_2_IMAGE_QUERY, theme.SERVICE_2_IMAGE_FALLBACK),
      fetchImage(theme.SERVICE_3_IMAGE_QUERY, theme.SERVICE_3_IMAGE_FALLBACK),
      ...ecImageFetches,
    ]);

    // EC商品に画像URLをセット
    ecProducts.forEach((p, i) => { p.image_url = ecImgs[i] || ''; });
    siteContent.EC_PRODUCTS = ecProducts;

    const fetchedCount = [heroImg, svc1Img, svc2Img, svc3Img, ...ecImgs].filter(Boolean).length;
    console.log(`   画像取得: ${fetchedCount}/${4 + ecProducts.length}`);

    // テーマ・画像URLをコンテンツにマージ
    Object.assign(siteContent, theme, {
      HERO_BG_IMAGE_URL: heroImg,
      SERVICE_1_IMAGE_URL: svc1Img,
      SERVICE_2_IMAGE_URL: svc2Img,
      SERVICE_3_IMAGE_URL: svc3Img,
    });

    // Step 5: HTML出力
    console.log('\n🏗️  Step 5/5: HTMLを生成中...');
    const memberName = siteContent.MEMBER_NAME || memberData.name || 'member';
    const outputPath = await generateSite(siteContent, memberName, templateType);

    console.log(`\n✅ 完了！`);
    console.log(`   出力先: ${outputPath}`);
    console.log(`   ブラウザで開く: open "${outputPath}"`);

  } catch (err) {
    console.error('\n❌ エラーが発生しました:');
    console.error(err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

main();
