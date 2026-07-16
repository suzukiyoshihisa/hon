import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:)/.test(trimmed)) return escapeHtml(trimmed);
  return '';
}

/** 料金プランセクションHTML生成 */
function buildPricingSection(pricing) {
  if (!Array.isArray(pricing) || pricing.length === 0) return '';

  const cards = pricing.map((item, i) => {
    const highlightClass = item.highlight ? 'pricing-card--highlight' : '';
    const tagHtml = item.tag
      ? `<span class="pricing-tag">${escapeHtml(item.tag)}</span>` : '';
    const features = Array.isArray(item.features)
      ? item.features.map(f =>
          `<li class="pricing-feature"><span class="pricing-feature-icon">✓</span>${escapeHtml(f)}</li>`
        ).join('')
      : '';
    const btnClass = item.highlight ? 'btn-primary' : 'btn-outline';

    return `        <div class="pricing-card ${highlightClass}" data-animate data-delay="${i + 1}">
          ${tagHtml}
          <p class="pricing-name">${escapeHtml(item.name || '')}</p>
          <div class="pricing-price">${escapeHtml(item.price || '')}</div>
          <p class="pricing-desc">${escapeHtml(item.description || '')}</p>
          <hr class="pricing-divider">
          <ul class="pricing-features">${features}</ul>
          <a href="#contact" class="${btnClass} pricing-btn">お問い合わせ</a>
        </div>`;
  }).join('\n');

  return `
  <!-- ========== PRICING ========== -->
  <section class="pricing-section py-24 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-4">
        <h2 class="text-3xl font-bold text-gray-700 section-title" data-animate>料金プラン</h2>
      </div>
      <p class="text-center text-xs text-gray-400 mb-16" data-animate>※料金はサンプルです。詳細はお問い合わせください。</p>
      <div class="pricing-grid">
${cards}
      </div>
    </div>
  </section>`;
}

/** ECコンテンツセクションHTML生成 */
function buildEcSection(products) {
  if (!Array.isArray(products) || products.length === 0) return '';

  const cards = products.map((p, i) => {
    const imgUrl = sanitizeUrl(p.image_url || '');
    const imgHtml = imgUrl
      ? `<img src="${imgUrl}" alt="${escapeHtml(p.name || '')}" class="ec-image" onerror="this.parentElement.style.background='var(--color-light)';this.remove()">`
      : '';
    return `        <div class="ec-card card-hover" data-animate data-delay="${i + 1}">
          <div class="ec-image-wrap">${imgHtml}</div>
          <div class="ec-body">
            <p class="ec-name">${escapeHtml(p.name || '')}</p>
            <p class="ec-desc">${escapeHtml(p.description || '')}</p>
            <div class="ec-footer">
              <span class="ec-price">${escapeHtml(p.price || '')}</span>
              <a href="#contact" class="btn-primary ec-btn">詳しく見る</a>
            </div>
          </div>
        </div>`;
  }).join('\n');

  return `
  <!-- ========== EC PRODUCTS ========== -->
  <section class="section-white py-24 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-wrap items-center justify-center gap-3 mb-4">
        <h2 class="text-3xl font-bold text-gray-700 section-title" data-animate>おすすめ商品・グッズ</h2>
        <span class="sample-badge" data-animate>SAMPLE</span>
      </div>
      <p class="text-center text-xs text-gray-400 mb-16" data-animate>こちらはサンプルコンテンツです</p>
      <div class="ec-grid">
${cards}
      </div>
    </div>
  </section>`;
}

/** 推薦スライダーセクションHTML生成 */
function buildTestimonialsSection(testimonials) {
  if (!Array.isArray(testimonials) || testimonials.length === 0) return '';

  const slides = testimonials.map(t => {
    const initial = escapeHtml((t.name || '?').charAt(0));
    return `        <div class="swiper-slide">
          <div class="testimonial-card">
            <div class="testimonial-quote">"</div>
            <p class="testimonial-text">${escapeHtml(t.text || '')}</p>
            <div class="testimonial-footer">
              <div class="testimonial-avatar">${initial}</div>
              <div>
                <p class="testimonial-name">${escapeHtml(t.name || '')}</p>
                ${t.company ? `<p class="testimonial-company">${escapeHtml(t.company)}</p>` : ''}
              </div>
            </div>
          </div>
        </div>`;
  }).join('\n');

  const loopEnabled = testimonials.length > 1;
  const spv = Math.min(2, testimonials.length);

  return `
  <!-- ========== TESTIMONIALS ========== -->
  <section class="testimonials-section py-24 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-gray-700 section-title" data-animate>推薦のことば</h2>
      </div>
      <div class="swiper testimonial-swiper">
        <div class="swiper-wrapper">
${slides}
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
      </div>
    </div>
  </section>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      new Swiper('.testimonial-swiper', {
        loop: ${loopEnabled},
        autoplay: { delay: 5500, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        slidesPerView: 1,
        spaceBetween: 24,
        breakpoints: { 768: { slidesPerView: ${spv} } },
      });
    });
  </script>`;
}

export async function generateSite(siteContent, memberName, templateType) {
  const templatePath = path.join(TEMPLATES_DIR, templateType, 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`テンプレートが見つかりません: ${templatePath}`);
  }

  let html = fs.readFileSync(templatePath, 'utf-8');

  // 配列フィールドをHTML化して TESTIMONIALS_SECTION / PRICING_SECTION / EC_SECTION に変換
  const testimonials = Array.isArray(siteContent.TESTIMONIALS)
    ? siteContent.TESTIMONIALS
    : (() => { try { return JSON.parse(siteContent.TESTIMONIALS || '[]'); } catch { return []; } })();
  siteContent.TESTIMONIALS_SECTION = buildTestimonialsSection(testimonials);
  delete siteContent.TESTIMONIALS;

  siteContent.PRICING_SECTION = buildPricingSection(
    Array.isArray(siteContent.PRICING) ? siteContent.PRICING : []
  );
  delete siteContent.PRICING;

  siteContent.EC_SECTION = buildEcSection(
    Array.isArray(siteContent.EC_PRODUCTS) ? siteContent.EC_PRODUCTS : []
  );
  delete siteContent.EC_PRODUCTS;

  const urlKeys = [
    'PROFILE_IMAGE_URL', 'WEBSITE_URL',
    'HERO_BG_IMAGE_URL',
    'SERVICE_1_IMAGE_URL', 'SERVICE_2_IMAGE_URL', 'SERVICE_3_IMAGE_URL',
  ];
  const rawHtmlKeys = ['TESTIMONIALS_SECTION', 'PRICING_SECTION', 'EC_SECTION'];

  for (const [key, value] of Object.entries(siteContent)) {
    const placeholder = `{{${key}}}`;
    let safeValue;
    if (rawHtmlKeys.includes(key)) {
      safeValue = value || '';
    } else if (urlKeys.includes(key)) {
      safeValue = sanitizeUrl(value);
    } else {
      safeValue = escapeHtml(value);
    }
    html = html.split(placeholder).join(safeValue);
  }

  html = html.replace(/\{\{[A-Z0-9_]+\}\}/g, '');

  const safeName = memberName.replace(/[^a-zA-Z0-9\u3040-\u9fff_\- ]/g, '_').trim() || 'member';
  const outputDir = path.join(OUTPUT_DIR, safeName);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, html, 'utf-8');

  return outputPath;
}
