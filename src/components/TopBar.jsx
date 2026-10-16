import { Check, ChevronDown, Copy, LayoutGrid, Plus, Search, Settings2, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { siDuckduckgo, siGithub, siGoogle, siYoutube } from 'simple-icons';
import { useStore } from '../state/store';
import { calculateLocally, SEARCH_PROVIDERS, searchUrl } from '../lib/smartSearch';

const COPY_LABELS = { idle: 'Copy', copied: 'Copied', unavailable: 'Unavailable' };
const PROVIDER_MARKS = { google: siGoogle, duckduckgo: siDuckduckgo, youtube: siYoutube, github: siGithub };
const PROVIDER_COLORS = { google: '#4285f4', bing: '#00809d', duckduckgo: '#de5833', youtube: '#ff0033', chatgpt: '#10a37f', github: '#fff' };

function ProviderMark({ providerId, size = 20 }) {
  const mark = PROVIDER_MARKS[providerId];
  if (providerId === 'bing') return <span className="bing-mark" aria-hidden="true">b</span>;
  if (!mark) return <Sparkles size={size} color={PROVIDER_COLORS[providerId]} aria-hidden="true" />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={mark.path} transform="translate(0 0) scale(1)" />
    </svg>
  );
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function TopBar() {
  const { settings, update, drawerOpen, setDrawerOpen, editMode, setEditMode, editor, openEditor } = useStore();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [copyState, setCopyState] = useState('idle');
  const [providerOpen, setProviderOpen] = useState(false);
  const inputRef = useRef(null);
  const providerButtonRef = useRef(null);
  const providerMenuRef = useRef(null);
  const copyTimerRef = useRef(null);
  const providerId = settings.searchProvider ?? 'google';
  const provider = SEARCH_PROVIDERS.find((item) => item.id === providerId) ?? SEARCH_PROVIDERS[0];
  const localResult = calculateLocally(query);
  const copyLabel = COPY_LABELS[copyState];

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  useEffect(() => {
    if (!providerOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!providerMenuRef.current?.contains(event.target) && !providerButtonRef.current?.contains(event.target)) {
        setProviderOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setProviderOpen(false);
        providerButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [providerOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && editMode && !editor && !drawerOpen) setEditMode(false);
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editMode, editor, drawerOpen, setEditMode]);

  const onSearch = (e) => {
    e.preventDefault();
    const text = query.trim();
    if (!text || localResult) return;
    location.assign(searchUrl(providerId, text));
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(localResult.value);
      setCopyState('copied');
    } catch {
      setCopyState('unavailable');
    }
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyState('idle'), 1400);
  };

  const chooseProvider = (id) => {
    update({ searchProvider: id });
    setProviderOpen(false);
    inputRef.current?.focus();
  };

  return (
    <header className="topbar">
      <div className="clock">
        <div className="clock-time">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
        <div className="clock-date">
          {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
      <div className="topbar-actions">
        <div className="search-control">
          <form className="glass search-pill smart-search-pill" onSubmit={onSearch} role="search">
            <button
              ref={providerButtonRef}
              className="search-provider-button"
              type="button"
              aria-label={`Search provider: ${provider.name}`}
              aria-haspopup="menu"
              aria-expanded={providerOpen}
              onClick={() => setProviderOpen((open) => !open)}
            >
                <span className="search-provider-mark" style={{ color: PROVIDER_COLORS[provider.id] }}>
                  <ProviderMark providerId={provider.id} />
                </span>
              <span>{provider.name}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <span className="search-divider" aria-hidden="true" />
            <Search size={16} className="muted" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCopyState('idle');
              }}
              onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
              placeholder={`Search ${provider.name}`}
              aria-label={`Search with ${provider.name}`}
              autoComplete="off"
            />
            {!query && <kbd className="kbd">/</kbd>}
          </form>
          {providerOpen && (
            <div className="search-provider-menu" ref={providerMenuRef} role="menu" aria-label="Search providers">
              {SEARCH_PROVIDERS.map((item) => (
                <button
                  key={item.id}
                  className="search-provider-option"
                  type="button"
                  role="menuitemradio"
                  aria-checked={providerId === item.id}
                  onClick={() => chooseProvider(item.id)}
                >
                  <span className="search-provider-mark" style={{ color: PROVIDER_COLORS[item.id] }}>
                    <ProviderMark providerId={item.id} size={20} />
                  </span>
                  <span className="search-provider-copy">
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </span>
                  {providerId === item.id && <Check size={15} className="search-provider-check" />}
                </button>
              ))}
            </div>
          )}
          {localResult && (
            <div className="search-result" role="status" aria-live="polite">
              <div className="search-result-content">
                <span className="search-result-label">{localResult.label}</span>
                <strong>{localResult.value}</strong>
              </div>
              <button className="search-copy" type="button" onClick={copyResult} aria-label="Copy local result">
                {copyState === 'copied' ? <Check size={15} /> : <Copy size={15} />}
                <span>{copyLabel}</span>
              </button>
            </div>
          )}
        </div>
        {editMode ? (
          <button className="done-pill" onClick={() => setEditMode(false)}>
            Done
          </button>
        ) : (
          <button className="icon-btn" onClick={() => setEditMode(true)} aria-label="Edit layout" title="Edit layout">
            <LayoutGrid size={20} />
          </button>
        )}
        <button className="icon-btn" onClick={() => openEditor(null)} aria-label="New tile" title="New tile">
          <Plus size={20} />
        </button>
        <button
          className="icon-btn"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label="Open Glassify Studio"
          aria-expanded={drawerOpen}
        >
          <Settings2 size={20} />
        </button>
      </div>
    </header>
  );
}
