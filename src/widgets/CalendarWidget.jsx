import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import WidgetShell from './WidgetShell';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarWidget({ span = 'span-2x2' }) {
  const today = new Date();
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.toDateString());

  const year = view.getFullYear();
  const month = view.getMonth();
  const lead = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((lead + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, i) => new Date(year, month, 1 - lead + i));
  const shift = (delta) => setView(new Date(year, month + delta, 1));

  return (
    <WidgetShell
      span={span}
      title={view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
      titleClass="strong"
      action={
        <div className="-mr-1 flex">
          <button className="rounded-full p-1 hover:bg-white/20" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft size={14} />
          </button>
          <button className="rounded-full p-1 hover:bg-white/20" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight size={14} />
          </button>
        </div>
      }
    >
      <div className="cal-grid">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="muted pb-1 font-semibold">
            {d}
          </span>
        ))}
        {cells.map((date) => {
          const key = date.toDateString();
          const classes = [
            date.getMonth() !== month && 'outside',
            key === today.toDateString() && 'today',
            key === selected && 'selected',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button key={key} className={classes} onClick={() => setSelected(key)} aria-label={date.toDateString()}>
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </WidgetShell>
  );
}
