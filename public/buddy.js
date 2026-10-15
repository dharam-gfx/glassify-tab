(() => {
  if (window.top !== window || window.__glassifyBuddy) return;
  window.__glassifyBuddy = true;

  const KEY = 'hydration';
  const MINUTE = 60_000;
  const W = 72;
  const H = 88;
  const SPEED = 110;
  const RELATIONSHIP_LINES = {
    mom: ['{name}, sip before Mom calls!', 'Mom says: water, now!', '{name}, even plants drink!'],
    daddy: ['Hydrate like a champ, {name}!', 'Dad says: less scroll, more water!', 'Water break, {name}. Dad orders!'],
    friend: ['Sip or I steal your Wi-Fi, {name}!', 'Besties drink water, {name}!', 'Hydrate, {name}. I dare you!'],
    wife: ['Drink up, {name}, love!', 'Your wife says: sip, {name}!', 'Hydrate, {name}; kisses later!'],
    husband: ['Your husband says: sip, {name}!', 'Water, {name}. Husband orders!', 'Hydrate, love; husband request!'],
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const thirstyFace =
    '<path d="M32 58Q37 55 42 58M48 58Q53 55 58 58" class="line"/>' +
    '<ellipse cx="45" cy="70" rx="4.5" ry="3.6" fill="#0b2540"/><ellipse cx="45" cy="72.4" rx="2.8" ry="1.8" fill="#ff7a9a"/>' +
    '<path d="M14 30C14 30 10 36 10 38.5A4 4 0 0 0 18 38.5C18 36 14 30 14 30Z" class="sweat"/>';
  const happyFace = '<path d="M33 58Q37 53 41 58M49 58Q53 53 57 58" class="line"/><path d="M38 67Q45 77 52 67Z" fill="#0b2540"/>';

  const css = `
    :host { all: initial; }
    .buddy { position: fixed; top: 0; left: 0; z-index: 2147483646; width: ${W}px; height: ${H}px; pointer-events: none;
      transition-property: transform; transition-timing-function: linear; will-change: transform; font-family: system-ui, sans-serif; }
    .buddy.leaving { animation: fade 1.8s ease-in forwards; }
    .figure, svg { width: 100%; height: 100%; overflow: visible; }
    svg { filter: drop-shadow(0 6px 10px rgb(0 0 0 / .35)); }
    .walking svg { animation: hop .36s ease-in-out infinite alternate; }
    .leaving svg { animation: celebrate .6s cubic-bezier(.32,.72,0,1) 2; }
    .leg { transform-box: fill-box; transform-origin: 50% 0; }
    .leg path { fill: none; stroke: #0b2540; stroke-width: 4; stroke-linecap: round; }
    .leg ellipse { fill: #0b2540; }
    .walking .leg-l { animation: step .36s ease-in-out infinite alternate; }
    .walking .leg-r { animation: step .36s ease-in-out infinite alternate-reverse; }
    .skin { fill: #bfe9ff; stroke: #fff; stroke-width: 2; }
    .leaving .skin { fill: #6fd0ff; }
    .shine { fill: none; stroke: rgb(255 255 255 / .8); stroke-width: 3; stroke-linecap: round; }
    .line { fill: none; stroke: #0b2540; stroke-width: 2.6; stroke-linecap: round; }
    .cheek { fill: #ff7a9a; opacity: .5; }
    .arm { fill: none; stroke: #0b2540; stroke-width: 3.5; stroke-linecap: round; }
    .wave { transform-box: view-box; transform-origin: 20px 64px; animation: wave .8s ease-in-out infinite alternate; }
    .bottle { transform-box: fill-box; transform-origin: 50% 100%; animation: shake 1.4s ease-in-out infinite; }
    .glass { fill: rgb(233 247 255 / .95); stroke: #0b2540; stroke-width: 1.6; }
    .sweat { fill: #8ee3ff; stroke: #fff; stroke-width: 1; animation: sweat 1.4s ease-in infinite; }
    .bubble { position: absolute; bottom: calc(100% + 4px); left: 50%; padding: 5px 10px; border-radius: 12px; color: #1c1c1e;
      box-sizing: border-box; width: max-content; max-width: min(220px, calc(100vw - 24px)); background: #fff; font-size: 12px; font-weight: 600; line-height: 1.3;
      white-space: normal; text-align: center; box-shadow: 0 6px 16px rgb(0 0 0 / .25);
      transform: translateX(calc(-50% + var(--bubble-shift, 0px))); animation: pop .35s cubic-bezier(.32,.72,0,1); }
    .bubble::after { content: ""; position: absolute; top: 100%; left: calc(50% + var(--bubble-tail-shift, 0px)); margin-left: -5px; border: 5px solid transparent; border-top-color: #fff; }
    .bubble[hidden] { display: none; }
    @keyframes step { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
    @keyframes hop { to { transform: translateY(-4px); } }
    @keyframes wave { from { transform: rotate(-18deg); } to { transform: rotate(14deg); } }
    @keyframes shake { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(8deg); } }
    @keyframes sweat { 0% { opacity: 0; transform: translateY(-2px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(8px); } }
    @keyframes pop { from { opacity: 0; transform: translate(calc(-50% + var(--bubble-shift, 0px)), 6px) scale(.6); } }
    @keyframes celebrate { 50% { transform: translateY(-18px) rotate(-6deg); } }
    @keyframes fade { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
  `;

  const svg = `
    <svg viewBox="0 0 90 110" aria-hidden="true">
      <g class="leg leg-l"><path d="M37 86L35 100"/><ellipse cx="33" cy="102" rx="6.5" ry="3.2"/></g>
      <g class="leg leg-r"><path d="M53 86L55 100"/><ellipse cx="57" cy="102" rx="6.5" ry="3.2"/></g>
      <path d="M20 64Q10 66 7 74" class="arm wave"/>
      <path d="M45 6C45 6 18 40 18 62A27 27 0 0 0 72 62C72 40 45 6 45 6Z" class="skin"/>
      <path d="M28 52Q30 40 38 32" class="shine"/>
      <g class="face"></g>
      <circle cx="30" cy="66" r="3.4" class="cheek"/><circle cx="60" cy="66" r="3.4" class="cheek"/>
      <g class="bottle">
        <rect x="74" y="28" width="12" height="25" rx="4" class="glass"/>
        <rect x="75.6" y="41" width="8.8" height="10.4" rx="2.6" fill="#0a84ff"/>
        <rect x="76.5" y="22.5" width="7" height="6.5" rx="1.6" fill="#ff9f0a"/>
      </g>
      <path d="M70 64Q80 62 80 52" class="arm"/>
    </svg>`;

  let host = null;
  let parts = null;
  let pos = null;
  let timer = 0;
  let lastDrink = 0;
  let buddyTarget = 'friend';
  let userName = '';

  function pickLine() {
    const lines = RELATIONSHIP_LINES[buddyTarget] || RELATIONSHIP_LINES.friend;
    const line = lines[Math.floor(Math.random() * lines.length)];
    return line.replaceAll('{name}', userName || 'friend');
  }

  function today() {
    return new Date().toLocaleDateString('en-CA');
  }

  function isThirsty(s, now) {
    if (!s || !s.roamEverywhere || s.roam === false) return false;
    const intake = s.day === today() ? s.intake : 0;
    if (intake >= s.goal || now < (s.snoozeUntil || 0)) return false;
    if (s.workHours) {
      const hour = new Date(now).getHours();
      if (hour < 9 || hour >= 18) return false;
    }
    return now >= s.lastDrink + s.interval * MINUTE;
  }

  function say(text) {
    parts.bubble.textContent = text || '';
    parts.bubble.hidden = !text;
    if (!text) return;
    parts.bubble.style.setProperty('--bubble-shift', '0px');
    parts.bubble.style.setProperty('--bubble-tail-shift', '0px');
    requestAnimationFrame(fitBubble);
  }

  function fitBubble() {
    if (!parts || parts.bubble.hidden || !pos) return;
    const width = parts.bubble.offsetWidth;
    const left = pos.x + W / 2 - width / 2;
    const shift = left < 12 ? 12 - left : left + width > window.innerWidth - 12 ? window.innerWidth - 12 - left - width : 0;
    const tailShift = Math.max(-width / 2 + 10, Math.min(width / 2 - 10, -shift));
    parts.bubble.style.setProperty('--bubble-shift', `${shift}px`);
    parts.bubble.style.setProperty('--bubble-tail-shift', `${tailShift}px`);
  }

  function place(next, dur) {
    parts.buddy.style.transitionDuration = `${dur}s`;
    parts.buddy.style.transform = `translate(${next.x}px, ${next.y}px)`;
    if (pos) parts.figure.style.transform = next.x < pos.x ? 'scaleX(-1)' : '';
    pos = next;
  }

  function pickSpot() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 24;
    const edge = Math.random();
    if (edge < 0.6) return { x: margin + Math.random() * (vw - W - margin * 2), y: vh - H - 12 };
    const x = edge < 0.8 ? margin : vw - W - margin;
    return { x, y: vh * 0.35 + Math.random() * (vh * 0.65 - H - 12) };
  }

  function step() {
    const next = pickSpot();
    const dur = Math.max(0.6, Math.hypot(next.x - pos.x, next.y - pos.y) / SPEED);
    parts.buddy.classList.add('walking');
    say('');
    place(next, dur);
    timer = setTimeout(() => {
      parts.buddy.classList.remove('walking');
      say(pickLine());
      timer = setTimeout(step, 3000 + Math.random() * 3000);
    }, dur * 1000);
  }

  function show() {
    if (host) return;
    host = document.createElement('glassify-buddy');
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>${css}</style><div class="buddy"><span class="bubble" hidden></span><div class="figure">${svg}</div></div>`;
    parts = {
      buddy: root.querySelector('.buddy'),
      figure: root.querySelector('.figure'),
      bubble: root.querySelector('.bubble'),
      face: root.querySelector('.face'),
    };
    parts.face.innerHTML = thirstyFace;
    document.documentElement.appendChild(host);
    if (reduceMotion) {
      place({ x: window.innerWidth - W - 24, y: window.innerHeight - H - 24 }, 0);
      say(pickLine());
      return;
    }
    place({ x: -W, y: window.innerHeight - H - 12 }, 0);
    timer = setTimeout(step, 400);
  }

  function hide(thanks) {
    if (!host) return;
    clearTimeout(timer);
    const leaving = host;
    host = null;
    pos = null;
    if (!thanks) return leaving.remove();
    parts.buddy.classList.remove('walking');
    parts.buddy.classList.add('leaving');
    parts.face.innerHTML = happyFace;
    say(userName ? `Thanks ${userName}!` : 'Thanks!');
    setTimeout(() => leaving.remove(), 1800);
  }

  function check() {
    if (!chrome.runtime?.id) {
      clearInterval(poll);
      hide(false);
      return;
    }
    chrome.storage.local.get(KEY, ({ [KEY]: s }) => {
      if (chrome.runtime.lastError) return;
      chrome.storage.sync.get('settings', ({ settings }) => {
        if (chrome.runtime.lastError) return;
        buddyTarget = RELATIONSHIP_LINES[s?.buddyTarget] ? s.buddyTarget : 'friend';
        userName = settings?.userName?.trim() || '';
        const drankNow = !!s && s.lastDrink > lastDrink && lastDrink !== 0;
        lastDrink = s?.lastDrink || 0;
        if (isThirsty(s, Date.now()) && document.visibilityState === 'visible') show();
        else hide(drankNow);
      });
    });
  }

  chrome.storage.onChanged.addListener((changes, area) =>
    (area === 'local' && changes[KEY]) || (area === 'sync' && changes.settings) ? check() : undefined
  );
  window.addEventListener('resize', fitBubble);
  document.addEventListener('visibilitychange', check);
  const poll = setInterval(check, 30_000);
  check();
})();
