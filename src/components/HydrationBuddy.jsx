import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { BUDDY_TARGETS, drink, isThirsty, playGulp, PREVIEW_BUDDY_EVENT, QUICK_DRINKS, today, useHydration, useNow } from '../lib/hydration';
import { useStore } from '../state/store';

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
const THIRSTY_FAVICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><path d="M50 6C50 6 16 50 16 78A34 34 0 0 0 84 78C84 50 50 6 50 6Z" fill="#bfe9ff" stroke="#0a84ff" stroke-width="8"/><path d="M35 74Q40 70 45 74M55 74Q60 70 65 74" stroke="#0b2540" stroke-width="6" stroke-linecap="round" fill="none"/><ellipse cx="50" cy="92" rx="7" ry="6" fill="#0b2540"/></svg>'
)}`;

// Flashes the tab title and favicon so the reminder is visible from the tab strip.
function useTabAlert(active) {
  useEffect(() => {
    if (!active) return;
    const icon = document.querySelector('link[rel="icon"]');
    const original = { title: document.title, href: icon?.getAttribute('href') };
    icon?.setAttribute('href', THIRSTY_FAVICON);
    let flip = false;
    const timer = setInterval(() => {
      flip = !flip;
      document.title = flip ? '💧 Time to drink!' : original.title;
    }, 1500);
    return () => {
      clearInterval(timer);
      document.title = original.title;
      if (original.href) icon?.setAttribute('href', original.href);
    };
  }, [active]);
}

function pickSpot() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const selector = document.querySelector('.idle-overlay')
    ? '.idle-overlay > *'
    : '.dash .widget-slot, .dash .tile, .feed-rail';
  const surfaces = [...document.querySelectorAll(selector)]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > W * 0.6 && r.top > H && r.bottom < vh && r.left >= 0 && r.right <= vw);
  if (surfaces.length && Math.random() < 0.75) {
    const r = surfaces[Math.floor(Math.random() * surfaces.length)];
    const x = r.left + Math.random() * Math.max(0, r.width - W);
    return { x: Math.min(Math.max(0, x), vw - W), y: r.top - H + 4 };
  }
  return { x: Math.random() * (vw - W), y: vh - H - 12 };
}

function Walker({ happy }) {
  return (
    <svg viewBox="0 0 90 110" className="rb-svg" aria-hidden="true">
      <g className="rb-leg rb-leg-l">
        <path d="M37 86L35 100" />
        <ellipse cx="33" cy="102" rx="6.5" ry="3.2" />
      </g>
      <g className="rb-leg rb-leg-r">
        <path d="M53 86L55 100" />
        <ellipse cx="57" cy="102" rx="6.5" ry="3.2" />
      </g>
      <g className="rb-body">
        <path d="M20 64Q10 66 7 74" className="rb-arm rb-arm-wave" />
        <path
          d="M45 6C45 6 18 40 18 62A27 27 0 0 0 72 62C72 40 45 6 45 6Z"
          className={happy ? 'rb-skin happy' : 'rb-skin'}
        />
        <path d="M28 52Q30 40 38 32" className="rb-shine" />
        {happy ? (
          <>
            <path d="M33 58Q37 53 41 58M49 58Q53 53 57 58" className="rb-line" />
            <path d="M38 67Q45 77 52 67Z" fill="#0b2540" />
          </>
        ) : (
          <>
            <path d="M32 58Q37 55 42 58M48 58Q53 55 58 58" className="rb-line" />
            <ellipse cx="45" cy="70" rx="4.5" ry="3.6" fill="#0b2540" />
            <ellipse cx="45" cy="72.4" rx="2.8" ry="1.8" fill="#ff7a9a" />
            <path d="M14 30C14 30 10 36 10 38.5A4 4 0 0 0 18 38.5C18 36 14 30 14 30Z" className="rb-sweat" />
          </>
        )}
        <circle cx="30" cy="66" r="3.4" className="rb-cheek" />
        <circle cx="60" cy="66" r="3.4" className="rb-cheek" />
        <g className="rb-bottle">
          <rect x="74" y="28" width="12" height="25" rx="4" className="rb-bottle-glass" />
          <rect x="75.6" y="41" width="8.8" height="10.4" rx="2.6" fill="#0a84ff" />
          <rect x="76.5" y="22.5" width="7" height="6.5" rx="1.6" fill="#ff9f0a" />
        </g>
        <path d="M70 64Q80 62 80 52" className="rb-arm" />
      </g>
    </svg>
  );
}

function pickLine(targetKey, name) {
  const lines = RELATIONSHIP_LINES[targetKey] ?? ['Drink water!', 'Take a sip!', 'Water break!'];
  const line = lines[Math.floor(Math.random() * lines.length)];
  return line.replaceAll('{name}', name || 'friend');
}

export default function HydrationBuddy() {
  const { settings, editMode } = useStore();
  const [state, save] = useHydration();
  const now = useNow(10_000);
  const enabled = settings.layoutWidgets[settings.preset]?.includes('hydration');
  const due = !!state && enabled && isThirsty(state, now);
  const [preview, setPreview] = useState(false);
  const thirsty = (due && state.roam && !editMode) || preview;
  const justDrank = !!state && Date.now() - state.lastDrink < 5000;
  useTabAlert(due);

  const [phase, setPhase] = useState('hidden');
  const [pos, setPos] = useState({ x: -W, y: 0, dur: 0, flip: false });
  const [walking, setWalking] = useState(false);
  const [line, setLine] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const buddyRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const posRef = useRef(null);
  const bubbleRef = useRef(null);
  const targetKey = state?.buddyTarget;
  const target = BUDDY_TARGETS.find((item) => item.value === state?.buddyTarget)?.label;
  const userName = settings.userName.trim();

  useEffect(() => {
    if (phase !== 'roaming') setMenuOpen(false);
  }, [phase]);

  useEffect(() => {
    let timer;
    const showPreview = () => {
      clearTimeout(timer);
      setPreview(true);
      timer = setTimeout(() => setPreview(false), 16_000);
    };
    window.addEventListener(PREVIEW_BUDDY_EVENT, showPreview);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(PREVIEW_BUDDY_EVENT, showPreview);
    };
  }, []);

  useEffect(() => {
    if (thirsty) setPhase('roaming');
    else
      setPhase((p) => {
        if (p === 'roaming' && justDrank) return 'leaving';
        return p === 'leaving' ? p : 'hidden';
      });
  }, [thirsty, justDrank]);

  useEffect(() => {
    if (phase !== 'leaving') return;
    setWalking(false);
    setLine(userName ? `Thanks ${userName}!` : 'Thanks!');
    const timer = setTimeout(() => setPhase('hidden'), 1800);
    return () => clearTimeout(timer);
  }, [phase, userName]);

  useEffect(() => {
    if (phase !== 'roaming') {
      if (phase === 'hidden') posRef.current = null;
      return;
    }
    if (menuOpen) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (preview && !posRef.current) {
      const spot = { x: (window.innerWidth - W) / 2, y: window.innerHeight - H - 24 };
      posRef.current = spot;
      setPos({ ...spot, dur: 0, flip: false });
      setWalking(false);
      setLine(pickLine(targetKey, userName));
      if (reducedMotion) return;
    } else if (reducedMotion && !posRef.current) {
      const spot = { x: window.innerWidth - W - 24, y: window.innerHeight - H - 24 };
      posRef.current = spot;
      setPos({ ...spot, dur: 0, flip: false });
      setLine(pickLine(targetKey, userName));
      return;
    }
    if (reducedMotion) return;
    if (!posRef.current) {
      posRef.current = { x: -W, y: window.innerHeight - H - 12 };
      setPos({ ...posRef.current, dur: 0, flip: false });
    }
    let timer;
    const step = () => {
      const from = posRef.current;
      const to = pickSpot();
      const dur = Math.max(0.6, Math.hypot(to.x - from.x, to.y - from.y) / SPEED);
      posRef.current = to;
      setPos({ ...to, dur, flip: to.x < from.x });
      setWalking(true);
      setLine(null);
      timer = setTimeout(() => {
        setWalking(false);
        setLine(pickLine(targetKey, userName));
        timer = setTimeout(step, 2200 + Math.random() * 2200);
      }, dur * 1000);
    };
    timer = setTimeout(step, preview ? 1800 : 400);
    return () => clearTimeout(timer);
  }, [phase, preview, target, targetKey, userName, menuOpen]);

  useLayoutEffect(() => {
    const bubble = menuOpen ? menuRef.current : bubbleRef.current;
    if (!bubble) return undefined;
    const fit = () => {
      const width = bubble.offsetWidth;
      const left = pos.x + W / 2 - width / 2;
      const shift = left < 12 ? 12 - left : left + width > window.innerWidth - 12 ? window.innerWidth - 12 - left - width : 0;
      const tailShift = Math.max(-width / 2 + 10, Math.min(width / 2 - 10, -shift));
      bubble.style.setProperty('--bubble-shift', `${shift}px`);
      bubble.style.setProperty('--bubble-tail-shift', `${tailShift}px`);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [line, pos.x, menuOpen]);

  const openMenu = () => {
    if (phase !== 'roaming' || menuOpen || !state) return;
    const rect = buddyRef.current.getBoundingClientRect();
    const spot = {
      x: Math.max(0, Math.min(rect.left, window.innerWidth - W)),
      y: Math.max(52, Math.min(rect.top, window.innerHeight - H - 12)),
    };
    posRef.current = spot;
    setPos((previous) => ({ ...previous, ...spot, dur: 0 }));
    setWalking(false);
    setMenuOpen(true);
  };

  const logDrink = (ml) => {
    if (!state || phase !== 'roaming') return;
    const current = state.day === today() ? state : { ...state, day: today(), intake: 0, log: [] };
    save(drink(current, ml));
    setPreview(false);
    setMenuOpen(false);
    if (!state.muted) playGulp();
  };

  if (phase === 'hidden') return null;

  return (
    <div
      ref={buddyRef}
      className={`roam-buddy${walking ? ' walking' : ''}${phase === 'leaving' ? ' leaving' : ''}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transitionDuration: `${pos.dur}s` }}
      onMouseEnter={openMenu}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) setMenuOpen(false);
      }}
      onFocus={openMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(':hover')) setMenuOpen(false);
      }}
    >
      {line && !menuOpen && <span ref={bubbleRef} className="rb-bubble">{line}</span>}
      {menuOpen && (
        <div ref={menuRef} id={menuId} className="rb-drink-menu" role="group" aria-label="Log water">
          {QUICK_DRINKS.map(([ml, name]) => (
            <button key={ml} type="button" onClick={() => logDrink(ml)} title={`${name}, ${ml} mL`} aria-label={`Log ${ml} mL`}>
              +{ml} mL
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="rb-figure"
        style={{ transform: pos.flip ? 'scaleX(-1)' : undefined }}
        aria-label="Log a drink of water"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        disabled={phase === 'leaving'}
        onClick={() => {
          openMenu();
          requestAnimationFrame(() => menuRef.current?.querySelector('button')?.focus());
        }}
      >
        <Walker happy={phase === 'leaving'} />
      </button>
    </div>
  );
}
