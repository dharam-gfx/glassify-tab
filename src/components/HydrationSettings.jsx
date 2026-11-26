import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BUDDY_TARGETS, GOALS, INTERVALS, WORK_END, WORK_START, setRoamEverywhere } from '../lib/hydration';

const TOGGLES = [
  ['roam', 'Buddy on this dashboard'],
  ['roamEverywhere', 'Buddy on every website'],
  ['notify', 'Desktop notifications'],
  ['muted', 'Mute reminder sounds'],
  ['workHours', `Work hours only (${WORK_START}–${WORK_END - 12} PM)`],
];

export default function HydrationSettings({ state, save, onClose }) {
  const closeRef = useRef(null);

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

  const flip = async (key) => {
    const value = key === 'roamEverywhere' ? await setRoamEverywhere(!state.roamEverywhere) : !state[key];
    save({ ...state, [key]: value });
  };

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="hydra-report hydra-settings-modal" role="dialog" aria-modal="true" aria-labelledby="hydra-settings-title">
        <header className="hr-head">
          <h2 id="hydra-settings-title">Hydration settings</h2>
          <button ref={closeRef} className="hr-icon" onClick={onClose} aria-label="Close hydration settings">
            <X size={16} />
          </button>
        </header>

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
          {TOGGLES.map(([key, label]) => (
            <div key={key} className="hydra-toggle">
              <span>{label}</span>
              <button type="button" role="switch" aria-checked={state[key]} aria-label={label} className="hydra-switch" onClick={() => flip(key)} />
            </div>
          ))}
          <button
            type="button"
            className={`hydra-stop${state.stopped ? ' resume' : ''}`}
            onClick={() => save({ ...state, stopped: !state.stopped, lastDrink: state.stopped ? Date.now() : state.lastDrink })}
          >
            {state.stopped ? 'Resume hydration reminders' : 'Stop hydration reminders'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
