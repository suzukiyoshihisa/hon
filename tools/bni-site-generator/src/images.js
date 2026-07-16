/**
 * Unsplash API から画像URLを取得する
 * primaryQuery で取得できない場合 fallbackQuery を試みる
 */
export async function fetchImage(primaryQuery, fallbackQuery = '') {
  const result = await tryFetch(primaryQuery);
  if (result) return result;
  if (fallbackQuery) return (await tryFetch(fallbackQuery)) || '';
  return '';
}

async function tryFetch(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return '';
  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data?.urls?.regular || '';
  } catch {
    return '';
  }
}
