import { Flame, GitCommitHorizontal } from 'lucide-react';
import { useCached } from '../../lib/cache';
import { ghContributions } from '../../lib/devApi';
import WidgetShell from '../WidgetShell';
import { DevTitle, NeedsToken, QueryBody, RefreshButton, useGithubToken, useLinkProps } from './shared';

const WEEKS_SHOWN = 26;

function level(count, max) {
  if (!count) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

function streak(days) {
  let n = 0;
  // Today may not have contributions yet, so start counting from yesterday if needed.
  let i = days.length - 1;
  if (days[i]?.[1] === 0) i -= 1;
  for (; i >= 0 && days[i][1] > 0; i -= 1) n += 1;
  return n;
}

export default function ContributionsWidget({ span = 'span-4x2' }) {
  const token = useGithubToken();
  const linkProps = useLinkProps();
  const query = useCached(token ? `gh:contrib:${token.slice(-4)}` : null, 60 * 60_000, () => ghContributions(token));

  return (
    <WidgetShell
      span={span}
      className="dev-widget"
      title={
        <DevTitle icon={GitCommitHorizontal} color="#3fb950">
          Contributions
        </DevTitle>
      }
      action={token ? <RefreshButton query={query} /> : null}
    >
      {token === null && <NeedsToken what="your contribution graph" />}
      {token && (
        <QueryBody query={query} rows={3}>
          {(data) => {
            // GitHub's calendar is Sunday-aligned weeks; the last week is partial up to today.
            const lastWeekLength = data.days.length % 7 || 7;
            const recent = data.days.slice(-((WEEKS_SHOWN - 1) * 7 + lastWeekLength));
            const max = Math.max(1, ...recent.map((d) => d[1]));
            const current = streak(data.days);
            return (
              <div className="contrib">
                <div className="contrib-stats">
                  <a className="dev-title-link" href={`https://github.com/${data.login}`} {...linkProps}>
                    @{data.login}
                  </a>
                  <span className="dev-meta">
                    <strong className="contrib-total">{data.total.toLocaleString()}</strong> contributions in the last year
                  </span>
                  {current > 0 && (
                    <span className="contrib-streak">
                      <Flame size={12} /> {current}-day streak
                    </span>
                  )}
                </div>
                <div className="contrib-grid" style={{ '--weeks': Math.ceil(recent.length / 7) }}>
                  {recent.map(([date, count]) => (
                    <span key={date} className={`contrib-cell l${level(count, max)}`} title={`${count} on ${date}`} />
                  ))}
                </div>
              </div>
            );
          }}
        </QueryBody>
      )}
    </WidgetShell>
  );
}
