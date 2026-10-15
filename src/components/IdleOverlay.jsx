import { useEffect, useRef, useState } from 'react';
import { quoteOfTheDay } from '../lib/quotes';
import { useStore } from '../state/store';

export const PREVIEW_IDLE_EVENT = 'glassify:preview-idle';

export const CLOCK_STYLES = [
  { value: 'classic', label: 'Classic', sample: '9:41' },
  { value: 'stacked', label: 'Bold', sample: '09\n41' },
  { value: 'digital', label: 'Digital', sample: '9:41:07' },
  { value: 'flip', label: 'Flip', sample: '09 41' },
  { value: 'analog', label: 'Analog', sample: '' },
];

const WAKE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'];
// Ignore the tiny mouse jitter right after the screen appears so it doesn't vanish instantly.
const WAKE_GRACE_MS = 1200;

function greeting(hour) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function useClock(active) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

export default function IdleOverlay() {
  const { settings, drawerOpen, editor, editMode } = useStore();
  const [idle, setIdle] = useState(false);
  const shownAt = useRef(0);
  const now = useClock(idle);
  const armed = settings.idleEnabled && !drawerOpen && !editor && !editMode;

  const show = () => {
    shownAt.current = Date.now();
    setIdle(true);
  };

  useEffect(() => {
    window.addEventListener(PREVIEW_IDLE_EVENT, show);
    return () => window.removeEventListener(PREVIEW_IDLE_EVENT, show);
  }, []);

  useEffect(() => {
    let timer;
    const arm = () => {
      clearTimeout(timer);
      if (armed) timer = setTimeout(show, settings.idleDelay * 1000);
    };
    const wake = () => {
      if (Date.now() - shownAt.current < WAKE_GRACE_MS) return;
      setIdle(false);
      arm();
    };
    WAKE_EVENTS.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    arm();
    return () => {
      clearTimeout(timer);
      WAKE_EVENTS.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [armed, settings.idleDelay]);

  if (!idle) return null;

  const name = settings.userName.trim();
  const quote = settings.persona === 'off' ? null : quoteOfTheDay(settings.persona);
  const [quoteText, quoteAuthor] = quote ? quote.split(' — ') : [];
  const Clock = CLOCKS[settings.clockStyle] ?? CLOCKS.classic;

  return (
    <div className={`idle-overlay clock-${settings.clockStyle}`} role="dialog" aria-label="Clock screen">
      <div className="idle-date">{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      <Clock t={timeParts(now, settings.clock24h)} />
      <div className="idle-greeting">
        {greeting(now.getHours())}
        {name && `, ${name}`}
      </div>
      {quoteText && (
        <figure className="idle-quote">
          <blockquote>“{quoteText}”</blockquote>
          {quoteAuthor && <figcaption>{quoteAuthor}</figcaption>}
        </figure>
      )}
      <div className="idle-hint">Move the mouse or press any key</div>
    </div>
  );
}

const pad = (n) => String(n).padStart(2, '0');

function timeParts(now, is24h) {
  const h24 = now.getHours();
  let meridiem = null;
  if (!is24h) meridiem = h24 < 12 ? 'AM' : 'PM';
  return {
    h24,
    hh: is24h ? pad(h24) : String(h24 % 12 || 12),
    mm: pad(now.getMinutes()),
    ss: pad(now.getSeconds()),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    meridiem,
  };
}

function ClassicClock({ t }) {
  return (
    <div className="idle-time">
      {t.hh}:{t.mm}
      {t.meridiem && <span className="idle-meridiem">{t.meridiem}</span>}
    </div>
  );
}

function StackedClock({ t }) {
  return (
    <div className="idle-stacked" aria-label={`${t.hh}:${t.mm}`}>
      <span>{t.hh.padStart(2, '0')}</span>
      <span>{t.mm}</span>
    </div>
  );
}

function DigitalClock({ t }) {
  return (
    <div className="idle-digital">
      <div className="idle-digital-time">
        {t.hh}:{t.mm}
        <span className="idle-digital-sec">:{t.ss}</span>
        {t.meridiem && <span className="idle-meridiem">{t.meridiem}</span>}
      </div>
      <div className="idle-digital-bar">
        <span style={{ width: `${((t.seconds + 1) / 60) * 100}%` }} />
      </div>
    </div>
  );
}

function FlipCard({ value }) {
  return (
    <span className="flip-card">
      <span key={value} className="flip-value">
        {value}
      </span>
    </span>
  );
}

function FlipClock({ t }) {
  return (
    <div className="idle-flip">
      <FlipCard value={t.hh.padStart(2, '0')} />
      <FlipCard value={t.mm} />
      {t.meridiem && <span className="idle-flip-meridiem">{t.meridiem}</span>}
    </div>
  );
}

function AnalogClock({ t }) {
  const hourAngle = ((t.h24 % 12) + t.minutes / 60) * 30;
  const minuteAngle = (t.minutes + t.seconds / 60) * 6;
  const secondAngle = t.seconds * 6;
  return (
    <svg className="idle-analog" viewBox="0 0 200 200" role="img" aria-label={`${t.hh}:${t.mm}`}>
      <circle cx="100" cy="100" r="96" className="face" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="100"
          y1={i % 5 ? 10 : 8}
          x2="100"
          y2={i % 5 ? 14 : 20}
          className={i % 5 ? 'tick' : 'tick-hour'}
          transform={`rotate(${i * 6} 100 100)`}
        />
      ))}
      <line x1="100" y1="100" x2="100" y2="52" className="hand-hour" transform={`rotate(${hourAngle} 100 100)`} />
      <line x1="100" y1="100" x2="100" y2="26" className="hand-minute" transform={`rotate(${minuteAngle} 100 100)`} />
      <g transform={`rotate(${secondAngle} 100 100)`}>
        <line x1="100" y1="116" x2="100" y2="18" className="hand-second" />
      </g>
      <circle cx="100" cy="100" r="4" className="hub" />
      <circle cx="100" cy="100" r="1.6" className="hub-inner" />
    </svg>
  );
}

const CLOCKS = {
  classic: ClassicClock,
  stacked: StackedClock,
  digital: DigitalClock,
  flip: FlipClock,
  analog: AnalogClock,
};
