import { Newspaper } from 'lucide-react';
import { useState } from 'react';
import { useCached } from '../../lib/cache';
import { ago, hnStories } from '../../lib/devApi';
import { hostOf, normalizeUrl } from '../../lib/url';
import WidgetShell from '../WidgetShell';
import { Chips, DevTitle, QueryBody, RefreshButton, useLinkProps } from './shared';

const KINDS = [
  ['top', 'Top'],
  ['new', 'New'],
  ['best', 'Best'],
  ['show', 'Show'],
];

export default function HackerNewsWidget({ span = 'span-2x2' }) {
  const [kind, setKind] = useState('top');
  const query = useCached(`hn:${kind}`, 15 * 60_000, () => hnStories(kind));
  const linkProps = useLinkProps();

  return (
    <WidgetShell
      span={span}
      className="dev-widget"
      title={
        <DevTitle icon={Newspaper} color="#ff6600">
          Hacker News
        </DevTitle>
      }
      action={<RefreshButton query={query} />}
    >
      <Chips value={kind} onChange={setKind} options={KINDS} />
      <QueryBody query={query} rows={5}>
        {(stories) => (
          <ol className="dev-list">
            {stories.map((s, i) => {
              const thread = `https://news.ycombinator.com/item?id=${s.id}`;
              const href = normalizeUrl(s.url) ?? thread;
              return (
                <li key={s.id} className="hn-row">
                  <span className="hn-rank">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <a className="dev-title-link" href={href} {...linkProps}>
                      {s.title}
                    </a>
                    <div className="dev-meta">
                      <span className="hn-points">▲ {s.score}</span>
                      <a href={thread} {...linkProps}>
                        {s.comments} comments
                      </a>
                      <span>{ago(s.time)}</span>
                      {s.url && <span className="truncate">{hostOf(s.url)}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </QueryBody>
    </WidgetShell>
  );
}
