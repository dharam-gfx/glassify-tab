import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { today, useHydrationHistory } from '../lib/hydration';

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const fmt = (ml) => (ml >= 10_000 ? `${(ml / 1000).toFixed(1)} L` : `${Math.round(ml).toLocaleString()} mL`);
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function summarize(entries, year, month, todayKey) {
  const count = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: count }, (_, i) => {
    const key = dayKey(year, month, i + 1);
    const entry = entries[key];
    return { day: i + 1, key, ml: entry?.ml ?? 0, goal: entry?.goal ?? 0, future: key > todayKey };
  });
  const elapsed = days.filter((d) => !d.future);
  const total = elapsed.reduce((sum, d) => sum + d.ml, 0);
  const metDays = elapsed.filter((d) => d.goal && d.ml >= d.goal);
  const best = elapsed.reduce((top, d) => (d.ml > (top?.ml ?? 0) ? d : top), null);

  let longest = 0;
  let run = 0;
  for (const d of elapsed) {
    run = d.goal && d.ml >= d.goal ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return { days, total, average: elapsed.length ? total / elapsed.length : 0, met: metDays.length, tracked: elapsed.length, best, longest };
}

// Counts back from today (or yesterday if today isn't done yet) across all stored months.
function currentStreak(entries, todayKey) {
  const cursor = new Date(`${todayKey}T00:00:00`);
  const met = (date) => {
    const entry = entries[date.toLocaleDateString('en-CA')];
    return !!entry && entry.ml >= entry.goal;
  };
  if (!met(cursor)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (met(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function Stat({ label, value, hint }) {
  return (
    <div className="hr-stat">
      <span className="hr-stat-label">{label}</span>
      <strong>{value}</strong>
      {hint && <span className="hr-stat-hint">{hint}</span>}
    </div>
  );
}

export default function HydrationReport({ state, onClose }) {
  const history = useHydrationHistory();
  const todayKey = today();
  const [view, setView] = useState(() => ({ year: Number(todayKey.slice(0, 4)), month: Number(todayKey.slice(5, 7)) - 1 }));
  const closeRef = useRef(null);

  // Today's live state wins over the stored copy, which can lag by a tick.
  const entries = useMemo(() => {
    const merged = { ...(history ?? {}) };
    if (state.intake > 0) merged[state.day] = { ml: state.intake, goal: state.goal };
    return merged;
  }, [history, state.day, state.intake, state.goal]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    const previous = document.activeElement;
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const stats = useMemo(() => summarize(entries, view.year, view.month, todayKey), [entries, view, todayKey]);
  const streak = useMemo(() => currentStreak(entries, todayKey), [entries, todayKey]);

  const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
  const nowKey = todayKey.slice(0, 7);
  const oldest = Object.keys(entries).sort()[0]?.slice(0, 7) ?? nowKey;
  const shown = monthKey(view.year, view.month);
  const shift = (delta) => {
    const date = new Date(view.year, view.month + delta, 1);
    setView({ year: date.getFullYear(), month: date.getMonth() });
  };
  const title = new Date(view.year, view.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const lead = new Date(view.year, view.month, 1).getDay();
  const hasData = stats.days.some((d) => d.ml > 0);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="hydra-report" role="dialog" aria-modal="true" aria-labelledby="hydra-report-title">
        <header className="hr-head">
          <div className="hr-nav">
            <button className="hr-icon" onClick={() => shift(-1)} disabled={shown <= oldest} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <h2 id="hydra-report-title" aria-live="polite">
              {title}
            </h2>
            <button className="hr-icon" onClick={() => shift(1)} disabled={shown >= nowKey} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
          <button ref={closeRef} className="hr-icon" onClick={onClose} aria-label="Close hydration report">
            <X size={16} />
          </button>
        </header>

        <div className="hr-stats">
          <Stat label="Total" value={fmt(stats.total)} hint={`${stats.tracked} day${stats.tracked === 1 ? '' : 's'}`} />
          <Stat label="Daily average" value={fmt(stats.average)} />
          <Stat label="Goal reached" value={`${stats.met}/${stats.tracked}`} hint="days" />
          <Stat label="Best day" value={stats.best ? fmt(stats.best.ml) : '—'} hint={stats.best ? `${shown.slice(5)}-${pad(stats.best.day)}`.replace('-', '/') : undefined} />
          <Stat label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} />
          <Stat label="Longest this month" value={`${stats.longest} day${stats.longest === 1 ? '' : 's'}`} />
        </div>

        <div className="hr-calendar" role="grid" aria-label={`Daily water intake for ${title}`}>
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="hr-weekday" aria-hidden="true">
              {d}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`pad-${i}`} aria-hidden="true" />
          ))}
          {stats.days.map((d) => {
            const pct = d.goal ? Math.min(1, d.ml / d.goal) : 0;
            const label = d.future
              ? `Day ${d.day}`
              : d.ml
                ? `Day ${d.day}: ${d.ml.toLocaleString()} mL, ${Math.round((d.ml / (d.goal || state.goal)) * 100)}% of goal`
                : `Day ${d.day}: nothing logged`;
            return (
              <span
                key={d.key}
                role="gridcell"
                className={`hr-day${d.future ? ' future' : ''}${d.goal && d.ml >= d.goal ? ' met' : ''}${d.key === todayKey ? ' today' : ''}`}
                style={{ '--fill': pct }}
                title={label}
                aria-label={label}
              >
                <i aria-hidden="true" />
                <b>{d.day}</b>
              </span>
            );
          })}
        </div>

        {!hasData && <p className="hr-empty">Nothing logged in {title} yet. Log a drink and it shows up here.</p>}

        <footer className="hr-legend" aria-hidden="true">
          <span>
            <i className="empty" /> None
          </span>
          <span>
            <i className="partial" /> Partial
          </span>
          <span>
            <i className="full" /> Goal reached
          </span>
          <em>Stored only on this device</em>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
