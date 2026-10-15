import { LayoutGrid, Plus, Search, Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function TopBar() {
  const { drawerOpen, setDrawerOpen, editMode, setEditMode, editor, openEditor } = useStore();
  const now = useNow();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

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
    if (!text) return;
    if (typeof chrome !== 'undefined' && chrome.search?.query) {
      chrome.search.query({ text, disposition: 'CURRENT_TAB' });
    } else {
      location.assign(`https://www.google.com/search?q=${encodeURIComponent(text)}`);
    }
  };

  return (
    <header className="topbar">
      <div className="clock">
        <div className="clock-time">{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
        <div className="clock-date">
          {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <form className="glass search-pill" style={{ borderRadius: '999px' }} onSubmit={onSearch} role="search">
          <Search size={16} className="muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
            placeholder="Search"
            aria-label="Search the web"
          />
          {!query && <kbd className="kbd">/</kbd>}
        </form>
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
