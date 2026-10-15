import { Droplet, Settings2, Timer, Undo2, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import {
  BUDDY_TARGETS,
  GOALS,
  INTERVALS,
  WORK_END,
  WORK_START,
  drink,
  goalMet,
  isQuiet,
  isThirsty,
  nextDrinkAt,
  playDrop,
  playGulp,
  setRoamEverywhere,
  shouldAlert,
  today,
  undoDrink,
  useHydration,
  useNow,
} from '../lib/hydration';
import WidgetShell from './WidgetShell';

const DROP = 'M50 6C50 6 16 50 16 78A34 34 0 0 0 84 78C84 50 50 6 50 6Z';
const WAVE = 'M-100 0Q-87.5 -6 -75 0T-50 0T-25 0T0 0T25 0T50 0T75 0T100 0T125 0T150 0T175 0T200 0V140H-100Z';
const SPARKLE = 'M0-6L1.5-1.5L6 0L1.5 1.5L0 6L-1.5 1.5L-6 0L-1.5-1.5Z';

function Face({ mood }) {
  if (mood === 'thirsty') {
    return (
      <g className="hydra-face">
        <path d="M35 74Q40 70 45 74M55 74Q60 70 65 74" className="hydra-line" />
        <ellipse cx="50" cy="89" rx="5" ry="4" fill="#0b2540" />
        <ellipse cx="50" cy="91.5" rx="3" ry="2" fill="#ff7a9a" />
        <path d="M80 40C80 40 75 47 75 50A5 5 0 0 0 85 50C85 47 80 40 80 40Z" className="hydra-sweat" />
      </g>
    );
  }
  const happy = mood !== 'calm';
  return (
    <g className="hydra-face">
      <g className="hydra-eyes">
        <ellipse cx="40" cy="74" rx="3.6" ry="4.6" fill="#0b2540" />
        <ellipse cx="60" cy="74" rx="3.6" ry="4.6" fill="#0b2540" />
        <circle cx="41.2" cy="72.4" r="1.2" fill="#fff" />
        <circle cx="61.2" cy="72.4" r="1.2" fill="#fff" />
      </g>
      <circle cx="33" cy="84" r="4" className="hydra-cheek" />
      <circle cx="67" cy="84" r="4" className="hydra-cheek" />
      {happy ? <path d="M42 85Q50 96 58 85Z" fill="#0b2540" /> : <path d="M44 86Q50 91 56 86" className="hydra-line" />}
    </g>
  );
}

function HydrationMascot({ level, mood }) {
  const uid = useId().replace(/:/g, '');
  const top = 112 - level * 108;
  return (
    <svg className={`hydra-mascot mood-${mood}`} viewBox="0 0 100 120" aria-hidden="true">
      <defs>
        <clipPath id={`${uid}-clip`}>
          <path d={DROP} />
        </clipPath>
        <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ee3ff" />
          <stop offset="1" stopColor="#0a84ff" />
        </linearGradient>
      </defs>
      <g className="hydra-figure">
        <path d={DROP} className="hydra-shell" />
        <g clipPath={`url(#${uid}-clip)`}>
          <g className="hydra-level" style={{ transform: `translateY(${top}px)` }}>
            <path className="hydra-wave" d={WAVE} fill={`url(#${uid}-water)`} />
          </g>
        </g>
        <path d={DROP} className="hydra-outline" />
        <path d="M30 60Q32 46 42 36" className="hydra-shine" />
        <Face mood={mood} />
      </g>
      {mood === 'celebrate' && (
        <g className="hydra-sparkles">
          <g transform="translate(14 34)">
            <path d={SPARKLE} />
          </g>
          <g transform="translate(88 28) scale(0.8)">
            <path d={SPARKLE} />
          </g>
          <g transform="translate(90 74) scale(0.6)">
            <path d={SPARKLE} />
          </g>
        </g>
      )}
    </svg>
  );
}

function statusText(s, now) {
  if (goalMet(s)) return 'Daily goal reached!';
  if (isQuiet(s, now)) return 'Paused until 9 AM';
  if (isThirsty(s, now)) return 'Time for a sip!';
  return `${(s.goal - s.intake).toLocaleString()} mL to go`;
}

const GLASS_ML = 250;
const QUICK = [
  [150, 'Sip'],
  [250, 'Glass'],
  [500, 'Bottle'],
];

function GlassMeter({ intake, goal }) {
  const glasses = Math.round(goal / GLASS_ML);
  const done = Math.min(glasses, Math.floor(intake / GLASS_ML));
  return (
    <div className="hydra-meter" role="img" aria-label={`${done} of ${glasses} glasses`}>
      {Array.from({ length: glasses }, (_, i) => (
        <span key={i} className="hydra-dot" style={{ '--fill': Math.min(1, Math.max(0, (intake - i * GLASS_ML) / GLASS_ML)) }} />
      ))}
    </div>
  );
}

const SNOOZE_MS = 10 * 60_000;

function CountdownPill({ s, now }) {
  const done = goalMet(s);
  const quiet = !done && isQuiet(s, now);
  const due = !done && !quiet && isThirsty(s, now);
  const snoozed = s.snoozeUntil > now;
  const left = Math.max(0, (snoozed ? s.snoozeUntil : nextDrinkAt(s)) - now);
  const mm = Math.floor(left / 60_000);
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, '0');

  let label = `${mm}:${ss}`;
  let tone = left < 5 * 60_000 ? 'soon' : '';
  if (done) [label, tone] = ['Done', 'done'];
  else if (quiet) [label, tone] = ['Paused', 'quiet'];
  else if (due) [label, tone] = ['Drink!', 'due'];

  const title = snoozed ? `Snoozed — ${mm}:${ss} left` : `Next sip in ${mm}:${ss}`;
  return (
    <span
      className={`hydra-timer ${tone}`}
      role="timer"
      aria-label={due ? 'Time to drink' : title}
      title={due || done || quiet ? undefined : title}
      style={{ '--left': Math.min(1, left / (snoozed ? SNOOZE_MS : s.interval * 60_000)) }}
    >
      <Timer size={11} />
      {label}
    </span>
  );
}

export default function HydrationWidget({ span = 'span-2x2' }) {
  const [state, save] = useHydration();
  const now = useNow(1_000);
  const [celebrating, setCelebrating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pop, setPop] = useState(null);

  useEffect(() => {
    if (!state) return;
    if (state.day !== today()) return save(state);
    if (!shouldAlert(state, now) || document.visibilityState !== 'visible') return;
    if (!state.muted) playDrop();
    save({ ...state, lastAlert: now });
  }, [state, now, save]);

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), 1800);
    return () => clearTimeout(timer);
  }, [celebrating]);

  useEffect(() => {
    if (!pop) return;
    const timer = setTimeout(() => setPop(null), 1100);
    return () => clearTimeout(timer);
  }, [pop]);

  if (!state) return <WidgetShell span={span} title="Hydration" />;

  const level = Math.min(1, state.intake / state.goal);
  let mood = 'calm';
  if (celebrating) mood = 'celebrate';
  else if (goalMet(state)) mood = 'goal';
  else if (isThirsty(state, now)) mood = 'thirsty';

  const log = (ml) => {
    save(drink(state, ml));
    setCelebrating(true);
    setPop({ id: Date.now(), ml });
    if (!state.muted) playGulp();
  };

  const header = (
    <span className="flex items-center gap-2">
      <span className="hydra-chip">
        <Droplet size={12} />
      </span>
      <span className="hydra-title">Hydration</span>
    </span>
  );

  const actions = (
    <span className="hydra-head-actions">
      {!settingsOpen && <CountdownPill s={state} now={now} />}
      <button
        className="hydra-icon-btn"
        onClick={() => save({ ...state, muted: !state.muted })}
        aria-label={state.muted ? 'Unmute reminders' : 'Mute reminders'}
        title={state.muted ? 'Unmute reminders' : 'Mute reminders'}
      >
        {state.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
      <button
        className="hydra-icon-btn"
        onClick={() => setSettingsOpen((open) => !open)}
        aria-label={settingsOpen ? 'Close hydration settings' : 'Hydration settings'}
        aria-expanded={settingsOpen}
      >
        {settingsOpen ? <X size={14} /> : <Settings2 size={14} />}
      </button>
    </span>
  );

  if (settingsOpen) {
    const toggles = [
      ['roam', 'Buddy on this dashboard'],
      ['roamEverywhere', 'Buddy on every website'],
      ['notify', 'Desktop notifications'],
      ['workHours', `Work hours only (${WORK_START}–${WORK_END - 12} PM)`],
    ];
    const flip = async (key) => {
      const value = key === 'roamEverywhere' ? await setRoamEverywhere(!state.roamEverywhere) : !state[key];
      save({ ...state, [key]: value });
    };
    return (
      <WidgetShell span={span} className="hydra-widget" title={header} action={actions}>
        <div className="hydra-settings">
          <span className="hydra-label">Remind every</span>
          <div className="chip-row" role="group" aria-label="Reminder interval">
            {INTERVALS.map((m) => (
              <button key={m} className="chip" aria-pressed={state.interval === m} onClick={() => save({ ...state, interval: m })}>
                {m}m
              </button>
            ))}
          </div>
          <span className="hydra-label">Daily goal</span>
          <div className="chip-row" role="group" aria-label="Daily goal">
            {GOALS.map((g) => (
              <button key={g} className="chip" aria-pressed={state.goal === g} onClick={() => save({ ...state, goal: g })}>
                {g / 1000}L
              </button>
            ))}
          </div>
          <div className="hydra-target-row">
            <span className="hydra-label">Buddy for</span>
            <select
              className="field hydra-target-select"
              aria-label="Buddy for"
              value={state.buddyTarget}
              onChange={(e) => save({ ...state, buddyTarget: e.target.value })}
            >
              {BUDDY_TARGETS.map((target) => (
                <option key={target.value} value={target.value}>
                  {target.label}
                </option>
              ))}
            </select>
          </div>
          {toggles.map(([key, label]) => (
            <div key={key} className="hydra-toggle">
              <span>{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={state[key]}
                aria-label={label}
                className="hydra-switch"
                onClick={() => flip(key)}
              />
            </div>
          ))}
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell span={span} className="hydra-widget" title={header} action={actions}>
      <div className="hydra-body">
        <HydrationMascot level={level} mood={mood} />
        <div className="hydra-stats">
          <div className="hydra-top">
            <div className="hydra-amount">
              <strong key={`amount-${pop?.id ?? 0}`} className={pop ? 'bump' : undefined}>
                {state.intake.toLocaleString()}
              </strong>
              <span>of {state.goal.toLocaleString()} mL</span>
              {pop && (
                <span key={`pop-${pop.id}`} className="hydra-pop" aria-hidden="true">
                  +{pop.ml}
                </span>
              )}
            </div>
          </div>
          <GlassMeter intake={state.intake} goal={state.goal} />
          <div className={`hydra-status${mood === 'thirsty' ? ' due' : ''}`}>{statusText(state, now)}</div>
        </div>
      </div>
      <div className="hydra-actions">
        <div className="hydra-quick" role="group" aria-label="Log water">
          {QUICK.map(([ml, name]) => (
            <button key={ml} onClick={() => log(ml)} title={`${name}, ${ml} mL`} aria-label={`Log ${ml} mL`}>
              +{ml}
            </button>
          ))}
        </div>
        <button
          className="hydra-btn ghost"
          onClick={() => save(undoDrink(state))}
          disabled={!state.log.length}
          aria-label="Undo last drink"
          title="Undo last drink"
        >
          <Undo2 size={14} />
        </button>
      </div>
    </WidgetShell>
  );
}
