import { GitPullRequest, GitPullRequestDraft } from 'lucide-react';
import { useState } from 'react';
import { useCached } from '../../lib/cache';
import { ago, ghPullRequests } from '../../lib/devApi';
import WidgetShell from '../WidgetShell';
import { Chips, DevTitle, NeedsToken, QueryBody, RefreshButton, useGithubToken, useLinkProps } from './shared';

const MODES = [
  ['mine', 'My PRs'],
  ['review', 'Review requests'],
];

export default function PullRequestsWidget({ span = 'span-2x2' }) {
  const [mode, setMode] = useState('mine');
  const token = useGithubToken();
  const linkProps = useLinkProps();
  const query = useCached(token ? `gh:prs:${mode}:${token.slice(-4)}` : null, 5 * 60_000, () => ghPullRequests(token, mode));

  return (
    <WidgetShell
      span={span}
      className="dev-widget"
      title={
        <DevTitle icon={GitPullRequest} color="#8957e5">
          Pull Requests
        </DevTitle>
      }
      action={token ? <RefreshButton query={query} /> : null}
    >
      {token === null && <NeedsToken what="your pull requests" />}
      {token && (
        <>
          <Chips value={mode} onChange={setMode} options={MODES} />
          <QueryBody query={query} rows={4}>
            {(prs) =>
              prs.length === 0 ? (
                <div className="empty-state">
                  <strong>Nothing open</strong>
                  <span className="muted">{mode === 'mine' ? 'No open pull requests.' : 'No reviews waiting on you.'}</span>
                </div>
              ) : (
                <ul className="dev-list">
                  {prs.map((pr) => (
                    <li key={pr.id} className="pr-row">
                      {pr.draft ? <GitPullRequestDraft size={15} className="muted" /> : <GitPullRequest size={15} color="#3fb950" />}
                      <div className="min-w-0 flex-1">
                        <a className="dev-title-link" href={pr.url} {...linkProps}>
                          {pr.title}
                        </a>
                        <div className="dev-meta">
                          <span className="truncate">
                            {pr.repo} #{pr.number}
                          </span>
                          <span>{ago(pr.updated)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryBody>
        </>
      )}
    </WidgetShell>
  );
}
