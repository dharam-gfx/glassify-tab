import { Check, CopyX, Loader2, MoonStar, Rocket, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DevTitle } from './dev/shared';
import Ring from './Ring';
import WidgetShell from './WidgetShell';

const GB = 1024 ** 3;
const hasApis = () => typeof chrome !== 'undefined' && !!chrome.tabs && !!chrome.system?.memory;

async function readStats() {
  const [mem, tabs, [self]] = await Promise.all([
    chrome.system.memory.getInfo(),
    chrome.tabs.query({}),
    chrome.tabs.query({ active: true, currentWindow: true }),
  ]);
  const seen = new Set();
  const duplicates = [];
  for (const t of tabs) {
    if (!t.url || t.pinned) continue;
    const key = t.url.split('#')[0];
    if (seen.has(key)) duplicates.push(t.id);
    else seen.add(key);
  }
  // Tabs that can safely go to sleep: not this one, not playing audio, not pinned, not already asleep.
  const sleepable = tabs.filter((t) => t.id !== self?.id && !t.active && !t.audible && !t.pinned && !t.discarded && t.autoDiscardable !== false);
  return {
    usedGb: (mem.capacity - mem.availableCapacity) / GB,
    totalGb: mem.capacity / GB,
    used: 1 - mem.availableCapacity / mem.capacity,
    tabs: tabs.length,
    sleeping: tabs.filter((t) => t.discarded).length,
    sleepable: sleepable.map((t) => t.id),
    duplicates,
  };
}

function Action({ icon: Icon, label, detail, state, disabled, onClick }) {
  let StateIcon = Icon;
  if (state === 'busy') StateIcon = Loader2;
  else if (state === 'done') StateIcon = Check;
  return (
    <button type="button" className={`boost-action ${state ?? ''}`} disabled={disabled || state === 'busy'} onClick={onClick}>
      <span className="boost-action-icon">
        <StateIcon size={16} className={state === 'busy' ? 'animate-spin' : ''} />
      </span>
      <span className="boost-action-label">{label}</span>
      <span className="boost-action-detail">{detail}</span>
    </button>
  );
}

export default function BoostWidget({ span = 'span-2x2' }) {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState({});
  const [message, setMessage] = useState('');

  const refresh = useCallback(() => hasApis() && readStats().then(setStats).catch(() => {}), []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  const run = async (key, task) => {
    setStatus((s) => ({ ...s, [key]: 'busy' }));
    try {
      setMessage(await task());
      setStatus((s) => ({ ...s, [key]: 'done' }));
    } catch {
      setMessage('Something went wrong — try again.');
      setStatus((s) => ({ ...s, [key]: undefined }));
    }
    setTimeout(() => setStatus((s) => ({ ...s, [key]: undefined })), 2500);
    refresh();
  };

  const freeMemory = () =>
    run('sleep', async () => {
      const before = stats.usedGb;
      const results = await Promise.allSettled(stats.sleepable.map((id) => chrome.tabs.discard(id)));
      const count = results.filter((r) => r.status === 'fulfilled' && r.value).length;
      await new Promise((r) => setTimeout(r, 1500));
      const after = await readStats();
      const freed = Math.max(0, before - after.usedGb);
      return `Put ${count} tab${count === 1 ? '' : 's'} to sleep${freed > 0.05 ? ` · freed ~${(freed * 1024).toFixed(0)} MB` : ''}`;
    });

  const clearCache = () =>
    run('cache', async () => {
      await chrome.browsingData.removeCache({ since: 0 });
      return 'Browser cache cleared';
    });

  const closeDuplicates = () =>
    run('dupes', async () => {
      const count = stats.duplicates.length;
      await chrome.tabs.remove(stats.duplicates);
      return `Closed ${count} duplicate tab${count === 1 ? '' : 's'}`;
    });

  const pct = stats ? Math.round(stats.used * 100) : 0;
  let ringColor = '#30d158';
  if (pct >= 85) ringColor = '#ff453a';
  else if (pct >= 70) ringColor = '#ff9f0a';

  return (
    <WidgetShell
      span={span}
      className="boost-widget"
      title={
        <DevTitle icon={Rocket} color="#ff375f">
          Browser Boost
        </DevTitle>
      }
    >
      {!hasApis() ? (
        <p className="muted">Available when running as an extension.</p>
      ) : (
        <>
          <div className="boost-top">
            <Ring value={stats?.used ?? 0} size={58} stroke={5} color={ringColor}>
              <span className="boost-pct">{stats ? `${pct}%` : '–'}</span>
            </Ring>
            <div className="boost-stats">
              <div>
                <span className="muted">Memory</span>
                <strong>{stats ? `${stats.usedGb.toFixed(1)} / ${stats.totalGb.toFixed(0)} GB` : '–'}</strong>
              </div>
              <div>
                <span className="muted">Tabs</span>
                <strong>
                  {stats?.tabs ?? '–'}
                  {stats?.sleeping ? <span className="muted font-medium"> · {stats.sleeping} asleep</span> : null}
                </strong>
              </div>
            </div>
          </div>

          <div className="boost-actions">
            <Action
              icon={MoonStar}
              label="Free RAM"
              detail={stats ? `${stats.sleepable.length} idle` : ''}
              state={status.sleep}
              disabled={!stats?.sleepable.length}
              onClick={freeMemory}
            />
            <Action icon={Sparkles} label="Clean" detail="Cache" state={status.cache} onClick={clearCache} />
            <Action
              icon={CopyX}
              label="Dedupe"
              detail={stats ? `${stats.duplicates.length} ${stats.duplicates.length === 1 ? 'tab' : 'tabs'}` : ''}
              state={status.dupes}
              disabled={!stats?.duplicates.length}
              onClick={closeDuplicates}
            />
          </div>
          <p className="boost-message" aria-live="polite">
            {message || 'Sleeping tabs reload when opened.'}
          </p>
        </>
      )}
    </WidgetShell>
  );
}
