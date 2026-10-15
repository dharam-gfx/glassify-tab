import { CircleDot, GitFork, Github, Plus, Star, X } from 'lucide-react';
import { useState } from 'react';
import { useCached } from '../../lib/cache';
import { REPO_PATTERN, ago, fmtCount, ghRepo } from '../../lib/devApi';
import WidgetShell from '../WidgetShell';
import { DevTitle, QueryBody, RefreshButton, useGithubToken, useLinkProps, useLocalList } from './shared';

const DEFAULT_REPOS = ['microsoft/vscode', 'facebook/react', 'vercel/next.js'];
const MAX_REPOS = 6;

export default function GitHubReposWidget({ span = 'span-2x2' }) {
  const [repos, saveRepos] = useLocalList('ghRepos', DEFAULT_REPOS);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const token = useGithubToken();
  const linkProps = useLinkProps();

  const ready = repos && token !== undefined;
  const query = useCached(
    ready ? `gh:repos:${repos.join(',')}:${token ? 'auth' : 'anon'}` : null,
    30 * 60_000,
    () => Promise.all(repos.map((r) => ghRepo(r, token).catch(() => ({ full: r, missing: true }))))
  );

  const add = (e) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('repo').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (!REPO_PATTERN.test(value)) return setError('Use owner/repo, e.g. vercel/next.js');
    if (!repos.includes(value)) saveRepos([...repos, value]);
    setAdding(false);
    setError('');
  };

  return (
    <WidgetShell
      span={span}
      className="dev-widget"
      title={
        <DevTitle icon={Github} color="#6e7681">
          GitHub Repos
        </DevTitle>
      }
      action={
        <span className="flex items-center">
          <RefreshButton query={query} />
          {repos?.length < MAX_REPOS && (
            <button className="widget-icon-btn" onClick={() => setAdding((v) => !v)} aria-label="Add repository">
              <Plus size={14} />
            </button>
          )}
        </span>
      }
    >
      {adding && (
        <form className="pill-input mb-2 mt-0" onSubmit={add}>
          <input name="repo" placeholder="owner/repo" aria-label="Repository" autoComplete="off" />
        </form>
      )}
      {error && <p className="dev-error">{error}</p>}
      <QueryBody query={query} rows={3}>
        {(items) => (
          <ul className="dev-list">
            {items.map((r, i) => (
              <li key={repos[i] ?? r.full} className="repo-row">
                {r.avatar ? <img className="repo-avatar" src={r.avatar} alt="" /> : <span className="repo-avatar" />}
                <div className="min-w-0 flex-1">
                  {r.missing ? (
                    <span className="dev-title-link muted">{r.full} · not found</span>
                  ) : (
                    <a className="dev-title-link" href={r.url} {...linkProps}>
                      {r.full}
                    </a>
                  )}
                  {!r.missing && (
                    <div className="dev-meta">
                      <span className="stat">
                        <Star size={11} /> {fmtCount(r.stars)}
                      </span>
                      <span className="stat">
                        <GitFork size={11} /> {fmtCount(r.forks)}
                      </span>
                      <span className="stat">
                        <CircleDot size={11} /> {fmtCount(r.issues)}
                      </span>
                      {r.language && <span>{r.language}</span>}
                      <span>pushed {ago(r.pushed)}</span>
                    </div>
                  )}
                </div>
                <button className="remove" aria-label={`Remove ${r.full}`} onClick={() => saveRepos(repos.filter((_, j) => j !== i))}>
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </QueryBody>
    </WidgetShell>
  );
}
