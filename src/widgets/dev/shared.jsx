import { Check, Copy, KeyRound, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { storage } from '../../state/storage';
import { useStore } from '../../state/store';

export const TOKEN_KEY = 'githubToken';

/** A list persisted in chrome.storage.local; returns [list | null while loading, save]. */
export function useLocalList(key, defaults) {
  const [list, setList] = useState(null);
  useEffect(() => {
    storage.get('local', [key]).then((r) => setList(Array.isArray(r[key]) ? r[key] : defaults));
  }, [key]);
  const save = (next) => {
    setList(next);
    storage.set('local', { [key]: next });
  };
  return [list, save];
}

/** GitHub token lives only in chrome.storage.local (never synced, never exported). */
export function useGithubToken() {
  const [token, setToken] = useState(undefined);
  useEffect(() => {
    storage.get('local', [TOKEN_KEY]).then((r) => setToken(r[TOKEN_KEY] || null));
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
    const onChange = (changes, area) => area === 'local' && TOKEN_KEY in changes && setToken(changes[TOKEN_KEY].newValue || null);
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);
  return token;
}

export function useLinkProps() {
  const { settings } = useStore();
  return settings.openIn === 'new' ? { target: '_blank', rel: 'noopener noreferrer' } : { rel: 'noreferrer' };
}

export function DevTitle({ icon: Icon, color, children }) {
  return (
    <span className="flex items-center gap-2">
      <span className="dev-chip" style={{ '--chip': color }}>
        <Icon size={12} />
      </span>
      {children}
    </span>
  );
}

export function RefreshButton({ query }) {
  if (query.status === 'idle') return null;
  const spinning = query.status === 'loading' || query.status === 'refreshing';
  return (
    <button className={`widget-icon-btn ${spinning ? 'spin' : ''}`} onClick={query.refresh} aria-label="Refresh" disabled={spinning}>
      <RefreshCw size={13} />
    </button>
  );
}

export function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`copy-btn ${done ? 'done' : ''}`}
      aria-label={label}
      title={label}
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export function Chips({ value, onChange, options }) {
  return (
    <div className="chip-row mb-2">
      {options.map(([id, label]) => (
        <button key={id} type="button" className="chip" aria-pressed={value === id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Renders loading skeletons, an error with retry, or the children render-prop with data. */
export function QueryBody({ query, rows = 4, children }) {
  if (query.status === 'loading' || (query.status === 'idle' && !query.data)) {
    return (
      <div className="flex flex-col gap-3 pt-1">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton h-3" style={{ width: `${90 - i * 12}%` }} />
        ))}
      </div>
    );
  }
  if (query.status === 'error' && !query.data) {
    return (
      <div className="empty-state">
        <span className="muted">{query.error}</span>
        <button className="widget-link mt-1" onClick={query.refresh}>
          Try again
        </button>
      </div>
    );
  }
  return children(query.data);
}

export function NeedsToken({ what }) {
  const { setDrawerOpen } = useStore();
  return (
    <div className="empty-state">
      <span className="empty-icon" style={{ color: '#a5a5ff', background: 'rgb(94 92 230 / 0.2)' }}>
        <KeyRound size={18} />
      </span>
      <strong>Connect GitHub</strong>
      <span className="muted">Add a token to see {what}.</span>
      <button className="widget-link mt-1" onClick={() => setDrawerOpen(true)}>
        Open Glassify Studio
      </button>
    </div>
  );
}
