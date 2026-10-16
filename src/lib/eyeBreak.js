export const EYE_BREAK_INTERVAL = 20 * 60_000;
export const EYE_BREAK_DURATION = 20_000;

export function createEyeBreakState(now = Date.now()) {
  return { enabled: true, nextAt: now + EYE_BREAK_INTERVAL, breakUntil: 0, pausedRemaining: 0, pausedBreak: false };
}

export function normalizeEyeBreakState(saved, now = Date.now()) {
  if (!saved || typeof saved.enabled !== 'boolean' || !Number.isFinite(saved.nextAt)) {
    return createEyeBreakState(now);
  }
  return advanceEyeBreakState({
    enabled: saved.enabled,
    nextAt: saved.nextAt,
    breakUntil: saved.breakUntil || 0,
    pausedRemaining: Math.max(0, saved.pausedRemaining || 0),
    pausedBreak: saved.pausedBreak === true,
  }, now);
}

export function advanceEyeBreakState(state, now = Date.now()) {
  if (!state.enabled) return state;
  if (state.breakUntil) {
    return now >= state.breakUntil ? { ...state, breakUntil: 0, pausedRemaining: 0, pausedBreak: false } : state;
  }
  if (now >= state.nextAt) {
    return { ...state, breakUntil: now + EYE_BREAK_DURATION, nextAt: now + EYE_BREAK_INTERVAL, pausedRemaining: 0 };
  }
  return state;
}

export function startEyeBreak(state, now = Date.now()) {
  if (state.pausedBreak && state.pausedRemaining > 0) {
    return { ...state, enabled: true, breakUntil: now + state.pausedRemaining, pausedRemaining: 0, pausedBreak: false };
  }
  const remaining = state.pausedRemaining || EYE_BREAK_INTERVAL;
  return { ...state, enabled: true, nextAt: now + remaining, breakUntil: 0, pausedRemaining: 0, pausedBreak: false };
}

export function pauseEyeBreak(state, now = Date.now()) {
  return {
    ...state,
    enabled: false,
    pausedRemaining: remainingEyeBreakMs(state, now),
    pausedBreak: !!state.breakUntil && state.breakUntil > now,
    breakUntil: 0,
  };
}

export function completeEyeBreak(state, now = Date.now()) {
  return { ...state, nextAt: now + EYE_BREAK_INTERVAL, breakUntil: 0, pausedRemaining: 0, pausedBreak: false };
}

export function remainingEyeBreakMs(state, now = Date.now()) {
  if (!state.enabled) return Math.max(0, state.pausedRemaining || 0);
  const deadline = state.breakUntil || state.nextAt;
  return Math.max(0, deadline - now);
}

export function formatEyeBreakTime(milliseconds) {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}