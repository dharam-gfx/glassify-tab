const KEY = 'hydration';
const NOTIFIED_KEY = 'hydrationNotifiedAt';
const ALARM = 'hydration-tick';
const NOTE_ID = 'hydration-reminder';
const SCRIPT_ID = 'hydration-buddy';
const ALL_SITES = { origins: ['<all_urls>'] };
const MINUTE = 60_000;
const SNOOZE_MIN = 10;
const DROP = 'M50 6C50 6 16 50 16 78A34 34 0 0 0 84 78C84 50 50 6 50 6Z';

const today = () => new Date().toLocaleDateString('en-CA');

// Mirrors src/lib/hydration.js; the worker can't import the app bundle.
function current(s) {
  if (!s) return null;
  return s.day === today() ? s : { ...s, day: today(), intake: 0, log: [] };
}

function isThirsty(s, now) {
  if (s.intake >= s.goal || now < (s.snoozeUntil || 0)) return false;
  if (s.workHours) {
    const hour = new Date(now).getHours();
    if (hour < 9 || hour >= 18) return false;
  }
  return now >= s.lastDrink + s.interval * MINUTE;
}

function paintDrop(size) {
  const canvas = new OffscreenCanvas(size, size);
  const g = canvas.getContext('2d');
  g.scale(size / 120, size / 120);
  g.translate(10, 0);
  const body = new Path2D(DROP);
  g.fillStyle = '#bfe9ff';
  g.fill(body);
  g.lineWidth = 8;
  g.strokeStyle = '#0a84ff';
  g.stroke(body);
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.strokeStyle = '#0b2540';
  g.stroke(new Path2D('M35 74Q40 70 45 74M55 74Q60 70 65 74'));
  g.fillStyle = '#0b2540';
  g.beginPath();
  g.ellipse(50, 92, 7, 6, 0, 0, Math.PI * 2);
  g.fill();
  return canvas;
}

async function dropDataUrl() {
  try {
    const blob = await paintDrop(128).convertToBlob({ type: 'image/png' });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return 'icons/icon128.png';
  }
}

async function setToolbar(thirsty) {
  if (thirsty) {
    const imageData = Object.fromEntries([16, 32].map((n) => [n, paintDrop(n).getContext('2d').getImageData(0, 0, n, n)]));
    await chrome.action.setIcon({ imageData });
    await chrome.action.setBadgeText({ text: 'SIP' });
    await chrome.action.setBadgeBackgroundColor({ color: '#0a84ff' });
    await chrome.action.setBadgeTextColor?.({ color: '#ffffff' });
    await chrome.action.setTitle({ title: 'Glassify — time to drink water!' });
  } else {
    await chrome.action.setIcon({ path: { 16: 'icons/icon16.png', 32: 'icons/icon32.png' } });
    await chrome.action.setBadgeText({ text: '' });
    await chrome.action.setTitle({ title: 'Glassify Tab' });
  }
}

async function evaluate() {
  const { [KEY]: raw, [NOTIFIED_KEY]: notifiedAt = 0 } = await chrome.storage.local.get([KEY, NOTIFIED_KEY]);
  const s = current(raw);
  const now = Date.now();
  const thirsty = !!s && isThirsty(s, now);
  await setToolbar(thirsty);
  if (!thirsty || s.notify === false) {
    await chrome.notifications.clear(NOTE_ID);
    return;
  }
  const dueAt = Math.max(s.lastDrink + s.interval * MINUTE, notifiedAt + s.interval * MINUTE, s.snoozeUntil || 0);
  if (now < dueAt) return;
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  // The dashboard already shows and plays its own reminder.
  if (active?.url?.startsWith(chrome.runtime.getURL('')) || active?.url === 'chrome://newtab/') {
    await chrome.notifications.clear(NOTE_ID);
    return;
  }
  await chrome.notifications.clear(NOTE_ID);
  await chrome.storage.local.set({ [NOTIFIED_KEY]: now });
  chrome.notifications.create(NOTE_ID, {
    type: 'basic',
    iconUrl: await dropDataUrl(),
    title: 'Time for a sip! 💧',
    message: `${s.intake.toLocaleString()} / ${s.goal.toLocaleString()} mL today — your water buddy is getting thirsty.`,
    buttons: [{ title: '+250 mL' }, { title: `Snooze ${SNOOZE_MIN} min` }],
    priority: 1,
    silent: !!s.muted,
  });
}

async function syncBuddyScript() {
  const { [KEY]: s } = await chrome.storage.local.get(KEY);
  const want = !!s?.roamEverywhere && s.roam !== false && (await chrome.permissions.contains(ALL_SITES));
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (want && !registered.length) {
    await chrome.scripting.registerContentScripts([
      { id: SCRIPT_ID, js: ['buddy.js'], matches: ['<all_urls>'], runAt: 'document_idle', persistAcrossSessions: true },
    ]);
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    for (const tab of tabs) chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['buddy.js'] }).catch(() => {});
  } else if (!want && registered.length) {
    await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  }
}

function refresh() {
  evaluate().catch(() => {});
  syncBuddyScript().catch(() => {});
}

function ensureAlarm() {
  chrome.alarms.get(ALARM).then((alarm) => alarm || chrome.alarms.create(ALARM, { periodInMinutes: 1 }));
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  refresh();
});
chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  refresh();
});
chrome.alarms.onAlarm.addListener((alarm) => alarm.name === ALARM && evaluate().catch(() => {}));
chrome.storage.onChanged.addListener((changes, area) => area === 'local' && changes[KEY] && refresh());
chrome.permissions.onAdded.addListener(refresh);
chrome.permissions.onRemoved.addListener(refresh);

chrome.notifications.onButtonClicked.addListener(async (id, index) => {
  if (id !== NOTE_ID) return;
  chrome.notifications.clear(id);
  const { [KEY]: raw } = await chrome.storage.local.get(KEY);
  const s = current(raw);
  if (!s) return;
  const now = Date.now();
  const next =
    index === 0
      ? { ...s, intake: s.intake + 250, log: [...(s.log || []), 250].slice(-30), lastDrink: now }
      : { ...s, snoozeUntil: now + SNOOZE_MIN * MINUTE };
  await chrome.storage.local.set({ [KEY]: next });
});

chrome.notifications.onClicked.addListener((id) => {
  if (id !== NOTE_ID) return;
  chrome.notifications.clear(id);
  chrome.tabs.create({});
});
