import { Moon, Plus, Sun, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { storage } from '../state/storage';
import WidgetShell from './WidgetShell';

const KEY = 'worldClocks';
const DEFAULT_ZONES = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];
const MAX_ZONES = 5;
const cityOf = (zone) => zone.split('/').pop().replace(/_/g, ' ');

function offsetLabel(zone, now) {
  const local = new Date(now.toLocaleString('en-US'));
  const there = new Date(now.toLocaleString('en-US', { timeZone: zone }));
  const diffH = Math.round((there - local) / 36e5);
  const dayDiff = there.getDate() - local.getDate();
  let day = 'Today';
  if (dayDiff > 0) day = 'Tomorrow';
  else if (dayDiff < 0) day = 'Yesterday';
  if (diffH === 0) return `${day}, same time`;
  return `${day}, ${diffH > 0 ? '+' : ''}${diffH}h`;
}

export default function WorldClockWidget({ span = 'span-2x2' }) {
  const [zones, setZones] = useState(null);
  const [adding, setAdding] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const inputRef = useRef(null);
  const allZones = useMemo(() => (Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : DEFAULT_ZONES), []);

  useEffect(() => {
    storage.get('local', [KEY]).then((r) => setZones(Array.isArray(r[KEY]) ? r[KEY] : DEFAULT_ZONES));
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const save = (next) => {
    setZones(next);
    storage.set('local', { [KEY]: next });
  };

  const addZone = (value) => {
    const zone = allZones.find((z) => z.toLowerCase() === value.trim().toLowerCase() || cityOf(z).toLowerCase() === value.trim().toLowerCase());
    if (zone && !zones.includes(zone)) save([...zones, zone]);
    setAdding(false);
  };

  return (
    <WidgetShell
      span={span}
      title="World Clock"
      action={
        zones?.length < MAX_ZONES && (
          <button className="widget-icon-btn" onClick={() => setAdding((v) => !v)} aria-label="Add city">
            <Plus size={14} />
          </button>
        )
      }
    >
      {adding && (
        <form
          className="pill-input mb-2 mt-0"
          onSubmit={(e) => {
            e.preventDefault();
            addZone(inputRef.current.value);
          }}
        >
          <input ref={inputRef} list="glassify-zones" placeholder="City, e.g. Paris" autoFocus aria-label="City" onBlur={(e) => !e.target.value && setAdding(false)} />
          <datalist id="glassify-zones">
            {allZones.map((z) => (
              <option key={z} value={cityOf(z)}>
                {z}
              </option>
            ))}
          </datalist>
        </form>
      )}
      <ul className="flex flex-col">
        {zones?.map((zone, i) => {
          const hour = Number(now.toLocaleString('en-US', { timeZone: zone, hour: 'numeric', hour12: false })) % 24;
          const isDay = hour >= 6 && hour < 18;
          return (
            <li key={zone} className={`clock-row ${i ? 'hairline border-t' : ''}`}>
              {isDay ? <Sun size={14} color="#ffd60a" /> : <Moon size={14} className="muted" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{cityOf(zone)}</div>
                <div className="muted truncate">{offsetLabel(zone, now)}</div>
              </div>
              <span className="clock-row-time">{now.toLocaleTimeString([], { timeZone: zone, hour: 'numeric', minute: '2-digit' })}</span>
              <button className="remove" aria-label={`Remove ${cityOf(zone)}`} onClick={() => save(zones.filter((z) => z !== zone))}>
                <X size={13} />
              </button>
            </li>
          );
        })}
      </ul>
    </WidgetShell>
  );
}
