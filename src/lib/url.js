export function normalizeUrl(input) {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function faviconUrl(pageUrl, size = 64, bust) {
  if (!pageUrl || typeof chrome === 'undefined' || !chrome.runtime?.getURL) return null;
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  if (bust) url.searchParams.set('_', String(bust));
  return url.toString();
}

// Google's favicon service returns 404 (so <img> onError fires) when it has no icon, unlike Chrome's
// _favicon which silently returns a grey globe for sites you haven't visited yet.
export function remoteIconUrl(pageUrl, size = 128) {
  if (!pageUrl) return null;
  const params = new URLSearchParams({
    client: 'SOCIAL',
    type: 'FAVICON',
    fallback_opts: 'TYPE,SIZE,URL',
    url: pageUrl,
    size: String(size),
  });
  return `https://t1.gstatic.com/faviconV2?${params}`;
}

/** Ordered list of icon URLs to try for a site; caller falls through on each onError. */
export function iconSources(pageUrl, { hd = true, size = 64, bust } = {}) {
  return [hd && remoteIconUrl(pageUrl, Math.max(64, size * 2)), faviconUrl(pageUrl, size, bust)].filter(Boolean);
}
