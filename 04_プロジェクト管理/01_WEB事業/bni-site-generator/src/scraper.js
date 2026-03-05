import { chromium } from 'playwright';
import 'dotenv/config';

const BNI_LOGIN_URL = 'https://www.bniconnectglobal.com/login/';

/**
 * BNI会員ページをスクレイプして会員データを返す
 * @param {string} memberUrl - 会員ページURL
 * @returns {Promise<MemberData>}
 */
export async function scrapeMemberPage(memberUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  try {
    console.log('🔐 BNIにログイン中...');
    await login(page);

    console.log('📄 会員ページを取得中...');
    await page.goto(memberUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForLoadState('networkidle');

    console.log('🔍 DOM解析中...');
    const memberData = await extractMemberData(page);

    return memberData;
  } finally {
    await browser.close();
  }
}

async function login(page) {
  const email = process.env.BNI_EMAIL;
  const password = process.env.BNI_PASSWORD;

  if (!email || !password) {
    throw new Error('.env に BNI_EMAIL と BNI_PASSWORD を設定してください');
  }

  await page.goto(BNI_LOGIN_URL, { waitUntil: 'networkidle' });

  // ログインフォームへの入力（セレクタ候補を複数試みる）
  const emailSelectors = ['input[name="username"]', 'input[name="email"]', 'input[type="email"]', '#email', '#username'];
  const passwordSelectors = ['input[name="password"]', 'input[type="password"]', '#password'];
  const submitSelectors = ['button[type="submit"]', 'input[type="submit"]', '.login-btn', '#loginBtn'];

  await fillFirst(page, emailSelectors, email);
  await fillFirst(page, passwordSelectors, password);
  await clickFirst(page, submitSelectors);

  // ダッシュボードへのリダイレクトを待つ
  await page.waitForURL('**/web/dashboard**', { timeout: 20000 });
  console.log('✅ ログイン完了');
}

async function fillFirst(page, selectors, value) {
  for (const selector of selectors) {
    try {
      await page.fill(selector, value, { timeout: 3000 });
      return;
    } catch {
      // 次のセレクタを試す
    }
  }
  throw new Error(`フォーム入力失敗: ${selectors.join(', ')}`);
}

async function clickFirst(page, selectors) {
  for (const selector of selectors) {
    try {
      await page.click(selector, { timeout: 3000 });
      return;
    } catch {
      // 次のセレクタを試す
    }
  }
  throw new Error(`ボタンクリック失敗: ${selectors.join(', ')}`);
}

async function extractMemberData(page) {
  const data = await page.evaluate(() => {
    const getText = (...selectors) => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.textContent?.trim()) return el.textContent.trim();
      }
      return '';
    };

    const getAttr = (attr, ...selectors) => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el?.[attr]) return el[attr];
      }
      return '';
    };

    const getAllText = (...selectors) => {
      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          return Array.from(els).map(el => el.textContent.trim()).filter(Boolean);
        }
      }
      return [];
    };

    return {
      name: getText(
        '.member-name', '.profile-name', 'h1.name', '[data-field="name"]',
        '.memberName', '#memberName', 'h1', 'h2.name'
      ),
      profession: getText(
        '.profession', '.job-title', '.member-profession', '[data-field="profession"]',
        '.businessCategory', '.memberProfession'
      ),
      company: getText(
        '.company-name', '.business-name', '.member-company', '[data-field="company"]',
        '.companyName', '.businessName'
      ),
      bio: getText(
        '.bio', '.about', '.member-bio', '[data-field="bio"]', '.description',
        '.memberBio', '.aboutMe', '.profile-description'
      ),
      phone: getText(
        '.phone', '.tel', '[data-field="phone"]', '.memberPhone',
        'a[href^="tel:"]'
      ),
      email: getText(
        '.email', '[data-field="email"]', '.memberEmail',
        'a[href^="mailto:"]'
      ),
      website: getAttr('href',
        'a.website', 'a[data-field="website"]', '.memberWebsite a',
        'a[href*="http"]:not([href*="bni"])'
      ),
      location: getText(
        '.location', '.address', '[data-field="location"]', '.memberLocation',
        '.city', '.chapter-location'
      ),
      profileImageUrl: (() => {
        // MUI: 1枚目=ログインユーザー, 2枚目=対象会員のアバター
        const avatars = document.querySelectorAll('img.MuiAvatar-img');
        return avatars.length >= 2 ? avatars[1].src : (avatars[0]?.src || '');
      })(),
      keywords: getAllText(
        '.keywords li', '.tags li', '.specialties li',
        '.keyword', '.tag', '.specialty'
      ),
      services: getAllText(
        '.services li', '.products li', '.offerings li',
        '.service-item', '.product-item'
      ),
      // バックアップ: ページ全体のテキスト（Claude用）
      pageRawText: document.body.innerText.substring(0, 6000),
    };
  });

  return data;
}
