import { Package, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useCached } from '../../lib/cache';
import { NPM_PATTERN, fmtCount, npmPackage } from '../../lib/devApi';
import WidgetShell from '../WidgetShell';
import { CopyButton, DevTitle, QueryBody, RefreshButton, useLinkProps, useLocalList } from './shared';

const DEFAULT_PACKAGES = ['react', 'vite', 'typescript'];
const MAX_PACKAGES = 6;

export default function NpmWidget({ span = 'span-2x2' }) {
  const [packages, savePackages] = useLocalList('npmPackages', DEFAULT_PACKAGES);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const linkProps = useLinkProps();

  const query = useCached(packages ? `npm:${packages.join(',')}` : null, 60 * 60_000, () =>
    Promise.all(packages.map((p) => npmPackage(p).catch(() => ({ name: p, missing: true }))))
  );

  const add = (e) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('pkg').trim().toLowerCase();
    if (!NPM_PATTERN.test(value)) return setError('Enter a valid package name, e.g. @tanstack/react-query');
    if (!packages.includes(value)) savePackages([...packages, value]);
    setAdding(false);
    setError('');
  };

  return (
    <WidgetShell
      span={span}
      className="dev-widget"
      title={
        <DevTitle icon={Package} color="#cb3837">
          npm Packages
        </DevTitle>
      }
      action={
        <span className="flex items-center">
          <RefreshButton query={query} />
          {packages?.length < MAX_PACKAGES && (
            <button className="widget-icon-btn" onClick={() => setAdding((v) => !v)} aria-label="Add package">
              <Plus size={14} />
            </button>
          )}
        </span>
      }
    >
      {adding && (
        <form className="pill-input mb-2 mt-0" onSubmit={add}>
          <input name="pkg" placeholder="package-name" aria-label="Package name" autoComplete="off" />
        </form>
      )}
      {error && <p className="dev-error">{error}</p>}
      <QueryBody query={query} rows={3}>
        {(items) => (
          <ul className="dev-list">
            {items.map((p) => (
              <li key={p.name} className="npm-row">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a className="dev-title-link truncate" href={`https://www.npmjs.com/package/${p.name}`} {...linkProps}>
                      {p.name}
                    </a>
                    {!p.missing && <span className="version-badge">v{p.version}</span>}
                  </div>
                  <div className="dev-meta">
                    {p.missing ? <span>Not found</span> : <span>{fmtCount(p.downloads)} / week</span>}
                    {p.description && <span className="truncate">{p.description}</span>}
                  </div>
                </div>
                {!p.missing && <CopyButton text={`npm i ${p.name}`} label={`Copy npm i ${p.name}`} />}
                <button className="remove" aria-label={`Remove ${p.name}`} onClick={() => savePackages(packages.filter((x) => x !== p.name))}>
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
