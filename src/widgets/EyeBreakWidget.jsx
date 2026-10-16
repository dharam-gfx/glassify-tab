import { Bell, Check, Eye, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { storage } from '../state/storage';
import {
  advanceEyeBreakState,
  completeEyeBreak,
  createEyeBreakState,
  formatEyeBreakTime,
  normalizeEyeBreakState,
  pauseEyeBreak,
  remainingEyeBreakMs,
  startEyeBreak,
  EYE_BREAK_DURATION,
  EYE_BREAK_INTERVAL,
} from '../lib/eyeBreak';
import WidgetShell from './WidgetShell';

const KEY = 'eyeBreak';
const SYNC_EVENT = 'glassify:eye-break';

function readEyeBreakState(saved) {
  try {
    return normalizeEyeBreakState(saved);
  } catch {
    return createEyeBreakState();
  }
}

function readStoredEyeBreakState(value) {
  if (!value) return createEyeBreakState();
  try {
    return readEyeBreakState(JSON.parse(value));
  } catch {
    return createEyeBreakState();
  }
}

async function loadEyeBreakState() {
  const saved = await storage.get('local', [KEY]);
  const loadedAt = Date.now();
  const initial = normalizeEyeBreakState(saved[KEY], loadedAt);
  if (!saved[KEY] || JSON.stringify(initial) !== JSON.stringify(saved[KEY])) {
    await storage.set('local', { [KEY]: initial });
  }
  return { initial, loadedAt };
}

function useEyeBreakState() {
  const [state, setState] = useState(null);
  const [now, setNow] = useState(Date.now);

  const save = useCallback((next) => {
    setState(next);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: next }));
    void storage.set('local', { [KEY]: next }).catch(() => {});
  }, []);

  useEffect(() => {
    let live = true;
    const onLocalChange = (event) => setState(event.detail);
    const onStorageChange = (event) => {
      if (event.key !== `local:${KEY}`) return;
      setState(readStoredEyeBreakState(event.newValue));
    };
    const onChromeChange = (changes, area) => {
      if (area !== 'local' || !changes[KEY]?.newValue) return;
      setState(readEyeBreakState(changes[KEY].newValue));
    };
    const chromeEvents = typeof chrome !== 'undefined' ? chrome.storage?.onChanged : null;

    loadEyeBreakState().then(({ initial, loadedAt }) => {
      if (!live) return;
      setNow(loadedAt);
      setState(initial);
    }).catch(() => {
      if (!live) return;
      const loadedAt = Date.now();
      setNow(loadedAt);
      setState(createEyeBreakState(loadedAt));
    });

    window.addEventListener(SYNC_EVENT, onLocalChange);
    window.addEventListener('storage', onStorageChange);
    chromeEvents?.addListener(onChromeChange);
    return () => {
      live = false;
      window.removeEventListener(SYNC_EVENT, onLocalChange);
      window.removeEventListener('storage', onStorageChange);
      chromeEvents?.removeListener(onChromeChange);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!state) return;
    const next = advanceEyeBreakState(state, now);
    if (next !== state) save(next);
  }, [state, now, save]);

  return { state, now, save };
}

function statusLabel(takingBreak, paused) {
  if (takingBreak) return 'Time to rest';
  if (paused) return 'Reminder paused';
  return 'Next break in';
}

export default function EyeBreakWidget({ span = 'span-2x2' }) {
  const { state, now, save } = useEyeBreakState();
  const [notificationFeedback, setNotificationFeedback] = useState('');

  const paused = state && !state.enabled;
  const takingBreak = !!state?.breakUntil && state.breakUntil > now;
  const remaining = state ? remainingEyeBreakMs(state, now) : EYE_BREAK_INTERVAL;
  const intervalLength = takingBreak ? EYE_BREAK_DURATION : EYE_BREAK_INTERVAL;
  const intervalProgress = state?.enabled ? 1 - remaining / intervalLength : 0;
  const message = takingBreak
    ? 'Look about 20 feet away and relax your eyes.'
    : 'Every 20 minutes, look 20 feet away for 20 seconds.';
  const testNotification = () => {
    if (typeof chrome === 'undefined' || !chrome.notifications?.create) {
      setNotificationFeedback('Install the extension to test desktop alerts.');
      return;
    }
    chrome.notifications.create('eye-break-preview', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'Eye break preview',
      message: 'Look about 20 feet away and relax your eyes for 20 seconds.',
      priority: 0,
      silent: true,
    }, () => {
      setNotificationFeedback(
        chrome.runtime.lastError
          ? 'Chrome could not create the notification.'
          : 'Test notification sent.'
      );
    });
  };
  const title = (
    <span className="eye-break-title">
      <Eye size={15} />
      Eye Break
    </span>
  );
  const action = state && (
    <span className="eye-break-head-actions">
      <button className="widget-icon-btn" type="button" onClick={testNotification} aria-label="Test eye-break notification" title="Test desktop notification">
        <Bell size={14} />
      </button>
      <button
        className="widget-icon-btn"
        type="button"
        onClick={() => {
          const next = state.enabled ? pauseEyeBreak(state, now) : startEyeBreak(state, now);
          save(next);
        }}
        aria-label={paused ? 'Resume eye break reminder' : 'Pause eye break reminder'}
        title={paused ? 'Resume reminder' : 'Pause reminder'}
      >
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
    </span>
  );

  return (
    <WidgetShell span={span} className="eye-break-widget" title={title} action={action}>
      <div className={`eye-break-body${takingBreak ? ' is-taking-break' : ''}${paused ? ' is-paused' : ''}`}>
        <div className="eye-break-progress" style={{ '--progress': `${Math.min(1, Math.max(0, intervalProgress)) * 100}%` }} aria-hidden="true">
          <span className="eye-break-icon"><Eye size={23} /></span>
        </div>
        <div className="eye-break-copy">
          <span className="eye-break-kicker">
            {statusLabel(takingBreak, paused)}
          </span>
          <span className="eye-break-time" role="timer" aria-label={formatEyeBreakTime(remaining)}>
            {formatEyeBreakTime(remaining)}
          </span>
          <p>{message}</p>
          {notificationFeedback && <output className="eye-break-feedback">{notificationFeedback}</output>}
          {takingBreak && (
            <button className="eye-break-done" type="button" onClick={() => save(completeEyeBreak(state, now))}>
              <Check size={14} /> Done for now
            </button>
          )}
        </div>
      </div>
    </WidgetShell>
  );
}