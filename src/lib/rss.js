function childText(element, name) {
  return Array.from(element.children).find((child) => child.localName === name)?.textContent?.trim() ?? '';
}

function itemLink(element, baseUrl) {
  const links = Array.from(element.children).filter((child) => child.localName === 'link');
  const link = links.find((child) => child.getAttribute('rel') === 'alternate') ?? links[0];
  const raw = link?.getAttribute('href') || link?.textContent?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw, baseUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function plainExcerpt(value) {
  if (!value) return '';
  const text = new DOMParser().parseFromString(value, 'text/html').body.textContent ?? '';
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177).trimEnd()}...` : normalized;
}

function parseItem(element, feed) {
  const title = childText(element, 'title');
  const link = itemLink(element, feed.url);
  if (!title || !link) return null;

  const id = childText(element, 'guid') || childText(element, 'id') || link;
  const excerpt = childText(element, 'description') || childText(element, 'summary') || childText(element, 'encoded');
  const published = childText(element, 'pubDate') || childText(element, 'published') || childText(element, 'updated');
  const timestamp = Date.parse(published);

  return {
    id,
    title: plainExcerpt(title),
    link,
    excerpt: plainExcerpt(excerpt),
    publishedAt: Number.isFinite(timestamp) ? timestamp : null,
    source: feed.name,
  };
}

export function parseRssFeed(xml, feed) {
  const documentNode = new DOMParser().parseFromString(xml, 'application/xml');
  if (documentNode.querySelector('parsererror')) throw new Error('This feed returned invalid XML.');
  const entries = [...documentNode.getElementsByTagName('item'), ...documentNode.getElementsByTagName('entry')];
  const articles = entries.map((entry) => parseItem(entry, feed)).filter(Boolean).slice(0, 12);
  if (!articles.length) throw new Error('No readable articles were found in this feed.');
  return articles;
}

export async function fetchRssFeed(feed) {
  const url = import.meta.env.DEV ? `/__rss/${feed.id}` : feed.url;
  const response = await fetch(url, {
    headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9' },
  });
  if (!response.ok) throw new Error(`Feed request failed (${response.status}).`);
  return parseRssFeed(await response.text(), feed);
}