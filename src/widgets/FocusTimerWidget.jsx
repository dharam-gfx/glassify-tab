import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { storage } from '../state/storage';
import Ring from './Ring';
import WidgetShell from './WidgetShell';

const MODES = {
  focus: { label: 'Focus', minutes: 25, color: '#ff6b6b' },
  short: { label: 'Short', minutes: 5, color: '#30d158' },
  long: { label: 'Long', minutes: 15, color: '#0a84ff' },
};
const KEY = 'focusTimer';
const fresh = (mode) => ({ mode, running: false, endsAt: 0, remaining: MODES[mode].minutes * 60_000 });

function chime() {
  try {
    const ctx = new AudioContext();
    [0, 0.18, 0.36].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = [660, 880, 1046][i];
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.45);
    });
  } catch {
    /* audio blocked: the visual "Done" state is enough */
  }
}

// Timer state lives in storage as an end timestamp, so every open new tab shows the same countdown.
export default function FocusTimerWidget({ span = 'span-2x2' }) {
  const [state, setState] = useState(null);
  const [, tick] = useState(0);
  const chimed = useRef(false);

  useEffect(() => {
    storage.get('local', [KEY]).then((r) => setState(r[KEY]?.mode in MODES ? r[KEY] : fresh('focus')));
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
    const onChange = (changes, area) => area === 'local' && changes[KEY]?.newValue && setState(changes[KEY].newValue);
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (!state?.running) return;
    const timer = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(timer);
  }, [state?.running]);

  const save = (next) => {
    setState(next);
    storage.set('local', { [KEY]: next });
  };

  const total = state ? MODES[state.mode].minutes * 60_000 : 0;
  const left = state?.running ? Math.max(0, state.endsAt - Date.now()) : state?.remaining ?? 0;
  const finished = !!state && left === 0;

  useEffect(() => {
    if (finished && state?.running && !chimed.current) {
      chimed.current = true;
      chime();
    }
    if (!finished) chimed.current = false;
  }, [finished, state?.running]);

  if (!state) return <WidgetShell span={span} title="Focus" />;

  const mode = MODES[state.mode];

  const mm = String(Math.floor(left / 60_000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, '0');

  const toggle = () => {
    if (finished) return save({ ...fresh(state.mode), running: true, endsAt: Date.now() + total });
    if (state.running) save({ ...state, running: false, remaining: left });
    else save({ ...state, running: true, endsAt: Date.now() + state.remaining });
  };

  return (
    <WidgetShell span={span} className="focus-widget" title="Focus">
      <div className="chip-row" role="group" aria-label="Timer mode">
        {Object.entries(MODES).map(([id, m]) => (
          <button key={id} className="chip" aria-pressed={state.mode === id} onClick={() => save(fresh(id))}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="focus-body">
        <Ring value={1 - left / total} size={96} stroke={6} color={mode.color}>
          <span className="focus-time">{finished ? 'Done' : `${mm}:${ss}`}</span>
        </Ring>
        <div className="focus-actions">
          <button className="round-btn primary" onClick={toggle} aria-label={state.running && !finished ? 'Pause' : 'Start'}>
            {state.running && !finished ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="round-btn" onClick={() => save(fresh(state.mode))} aria-label="Reset">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </WidgetShell>
  );
}
