// Runs `callback` immediately and then every `ms`, but only while the tab is visible.
// Display-only polling has no reason to wake the CPU for a hidden new tab.
export function startVisibleInterval(callback, ms) {
  let timer = null;
  const start = () => {
    if (timer !== null) return;
    callback();
    timer = setInterval(callback, ms);
  };
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };
  const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    stop();
  };
}
