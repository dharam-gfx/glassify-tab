import { useCallback, useEffect, useState } from 'react';
import { storage } from '../state/storage';

const KEY = 'hydration';
const SYNC_EVENT = 'glassify:hydration';
export const PREVIEW_BUDDY_EVENT = 'glassify:preview-hydration-buddy';
const MINUTE = 60_000;

export const INTERVALS = [15, 30, 40, 60];
export const GOALS = [1500, 2000, 2500, 3000];
export const BUDDY_TARGETS = [
  { value: 'mom', label: 'Mom' },
  { value: 'daddy', label: 'Daddy' },
  { value: 'friend', label: 'Friend' },
  { value: 'wife', label: 'Wife' },
  { value: 'husband', label: 'Husband' },
];
export const WORK_START = 9;
export const WORK_END = 18;

const DEFAULTS = {
  day: '',
  intake: 0,
  log: [],
  goal: 2000,
  interval: 40,
  lastDrink: 0,
  lastAlert: 0,
  muted: false,
  roam: true,
  workHours: false,
  notify: true,
  roamEverywhere: false,
  buddyTarget: 'friend',
  snoozeUntil: 0,
};

export const today = () => new Date().toLocaleDateString('en-CA');

function normalize(saved) {
  const s = { ...DEFAULTS, ...saved };
  if (!INTERVALS.includes(s.interval)) s.interval = DEFAULTS.interval;
  if (!GOALS.includes(s.goal)) s.goal = DEFAULTS.goal;
  if (!BUDDY_TARGETS.some((t) => t.value === s.buddyTarget)) s.buddyTarget = DEFAULTS.buddyTarget;
  if (!Array.isArray(s.log)) s.log = [];
  if (!s.lastDrink) s.lastDrink = Date.now();
  if (s.day !== today()) Object.assign(s, { day: today(), intake: 0, log: [] });
  return s;
}

// Shared by the widget and the roaming buddy; synced across tabs through chrome.storage.
export function useHydration() {
  const [state, setState] = useState(null);

  useEffect(() => {
    let live = true;
    storage.get('local', [KEY]).then((r) => live && setState(normalize(r[KEY])));
    const onLocal = (e) => setState(e.detail);
    const onChrome = (changes, area) => area === 'local' && changes[KEY]?.newValue && setState(normalize(changes[KEY].newValue));
    const chromeEvents = typeof chrome !== 'undefined' ? chrome.storage?.onChanged : null;
    window.addEventListener(SYNC_EVENT, onLocal);
    chromeEvents?.addListener(onChrome);
    return () => {
      live = false;
      window.removeEventListener(SYNC_EVENT, onLocal);
      chromeEvents?.removeListener(onChrome);
    };
  }, []);

  const save = useCallback((next) => {
    const value = normalize(next);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: value }));
    storage.set('local', { [KEY]: value });
  }, []);

  return [state, save];
}

export function useNow(ms) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms]);
  return now;
}

export const isQuiet = (s, now) => {
  if (!s.workHours) return false;
  const hour = new Date(now).getHours();
  return hour < WORK_START || hour >= WORK_END;
};
export const goalMet = (s) => s.intake >= s.goal;
export const nextDrinkAt = (s) => s.lastDrink + s.interval * MINUTE;
export const isThirsty = (s, now) => !goalMet(s) && !isQuiet(s, now) && now >= s.snoozeUntil && now >= nextDrinkAt(s);
export const shouldAlert = (s, now) => isThirsty(s, now) && now >= Math.max(s.lastDrink, s.lastAlert) + s.interval * MINUTE;

export const drink = (s, ml) => ({ ...s, intake: s.intake + ml, log: [...s.log, ml].slice(-30), lastDrink: Date.now(), snoozeUntil: 0 });
export const undoDrink = (s) =>
  s.log.length ? { ...s, intake: Math.max(0, s.intake - s.log.at(-1)), log: s.log.slice(0, -1) } : s;

let audio;

const ALL_SITES = { origins: ['<all_urls>'] };

// Must run from a click handler: Chrome only shows the permission prompt on a user gesture.
export async function setRoamEverywhere(enabled) {
  const permissions = typeof chrome !== 'undefined' ? chrome.permissions : null;
  if (!permissions) return enabled;
  try {
    if (enabled) return await permissions.request(ALL_SITES);
    await permissions.remove(ALL_SITES);
  } catch {
    return false;
  }
  return false;
}

function tone(from, to, start, length, volume, type = 'sine') {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const t = audio.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

function play(build) {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    build();
  } catch {
    /* audio unavailable: the mascot animation still signals the reminder */
  }
}

export const playDrop = () =>
  play(() => {
    tone(1400, 380, 0, 0.14, 0.16);
    tone(1000, 320, 0.2, 0.16, 0.12);
    tone(660, 990, 0.42, 0.25, 0.08, 'triangle');
  });

export const playGulp = () =>
  play(() => {
    tone(260, 140, 0, 0.12, 0.22);
    tone(240, 130, 0.16, 0.12, 0.2);
    tone(880, 1320, 0.36, 0.22, 0.09, 'triangle');
  });
