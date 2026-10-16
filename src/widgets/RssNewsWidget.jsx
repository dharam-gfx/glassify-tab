import { Newspaper } from 'lucide-react';
import { useState } from 'react';
import { useCached } from '../lib/cache';
import { fetchRssFeed } from '../lib/rss';
import WidgetShell from './WidgetShell';
import { Chips, DevTitle, QueryBody, RefreshButton, useLinkProps } from './dev/shared';

const FEEDS = [
  { id: 'tech', label: 'Tech', name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { id: 'world', label: 'World', name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'business', label: 'Business', name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { id: 'hn', label: 'HN', name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
];
const CACHE_TIME = 10 * 60_000;

function publishedLabel(timestamp) {
  if (!timestamp) return '';
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp);
}

export default function RssNewsWidget({ span = 'span-2x2' }) {
  const [feedId, setFeedId] = useState(FEEDS[0].id);
  const feed = FEEDS.find((item) => item.id === feedId) ?? FEEDS[0];
  const query = useCached(`rss:${feed.id}`, CACHE_TIME, () => fetchRssFeed(feed));
  const linkProps = useLinkProps();

  return (
    <WidgetShell
      span={span}
      className="dev-widget rss-widget"
      title={
        <DevTitle icon={Newspaper} color="#ff9f0a">
          News
        </DevTitle>
      }
      action={<RefreshButton query={query} />}
    >
      <Chips value={feedId} onChange={setFeedId} options={FEEDS.map(({ id, label }) => [id, label])} />
      <QueryBody query={query} rows={4}>
        {(articles) => (
          <ol className="dev-list rss-list" aria-label={`${feed.label} headlines`}>
            {articles.map((article) => (
              <li key={article.id}>
                <a className="rss-story" href={article.link} {...linkProps}>
                  <strong>{article.title}</strong>
                  <span className="rss-meta">
                    {article.source}
                    {article.publishedAt ? ` · ${publishedLabel(article.publishedAt)}` : ''}
                  </span>
                  {article.excerpt && <span className="rss-excerpt">{article.excerpt}</span>}
                </a>
              </li>
            ))}
          </ol>
        )}
      </QueryBody>
    </WidgetShell>
  );
}