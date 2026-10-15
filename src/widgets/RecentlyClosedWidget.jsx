import { AppWindow, History } from 'lucide-react';
import { useEffect, useState } from 'react';
import SiteIcon from '../components/SiteIcon';
import { hostOf } from '../lib/url';
import WidgetShell from './WidgetShell';

const hasSessions = () => typeof chrome !== 'undefined' && !!chrome.sessions;

function timeAgo(seconds) {
  const diff = Math.max(0, Date.now() / 1000 - seconds);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// Closed new-tab pages (including this dashboard) are noise, not something to restore.
function isUseful(tab) {
  if (!tab?.url) return false;
  return !tab.url.startsWith('chrome://newtab') && !tab.url.startsWith(chrome.runtime.getURL(''));
}

function toRow(entry) {
  if (entry.tab) {
    if (!isUseful(entry.tab)) return null;
    return { id: entry.tab.sessionId, url: entry.tab.url, title: entry.tab.title || hostOf(entry.tab.url), at: entry.lastModified };
  }
  const tabs = (entry.window?.tabs ?? []).filter(isUseful);
  if (!tabs.length) return null;
  const extra = tabs.length > 1 ? ` + ${tabs.length - 1} more` : '';
  return { id: entry.window.sessionId, title: `${tabs[0].title || hostOf(tabs[0].url)}${extra}`, at: entry.lastModified, isWindow: true };
}

function RowIcon({ row }) {
  if (row.isWindow) return <AppWindow size={16} />;
  return <SiteIcon url={row.url} />;
}

export default function RecentlyClosedWidget({ span = '' }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!hasSessions()) return setRows([]);
    const load = () =>
      chrome.sessions
        .getRecentlyClosed({ maxResults: 25 })
        .then((entries) => setRows(entries.map(toRow).filter(Boolean).slice(0, 6)));
    load();
    chrome.sessions.onChanged.addListener(load);
    return () => chrome.sessions.onChanged.removeListener(load);
  }, []);

  return (
    <WidgetShell span={span} title="Recently Closed">
      {rows?.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" style={{ color: '#ff9f0a', background: 'rgb(255 159 10 / 0.16)' }}>
            <History size={18} />
          </span>
          <strong>Nothing closed yet</strong>
          <span className="muted">Tabs you close will appear here.</span>
        </div>
      )}
      <div className="flex flex-col">
        {rows?.map((row) => (
          <button key={row.id} className="list-row" onClick={() => chrome.sessions.restore(row.id)} title={row.url ?? row.title}>
            <RowIcon row={row} />
            <span className="min-w-0 flex-1 truncate font-medium">{row.title}</span>
            <span className="muted shrink-0 tabular-nums">{timeAgo(row.at)}</span>
          </button>
        ))}
      </div>
    </WidgetShell>
  );
}
