import { useEffect, useState } from 'react';
import WidgetShell from './WidgetShell';

function progress(now) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const dayStart = new Date(y, m, now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - ((dayStart.getDay() + 6) % 7));
  const span = (start, end) => (now - start) / (end - start);
  return [
    { label: 'Day', value: span(dayStart, new Date(y, m, now.getDate() + 1)), color: '#ffd60a' },
    { label: 'Week', value: span(weekStart, new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7)), color: '#30d158' },
    { label: 'Month', value: span(new Date(y, m, 1), new Date(y, m + 1, 1)), color: '#0a84ff' },
    { label: 'Year', value: span(new Date(y, 0, 1), new Date(y + 1, 0, 1)), color: '#bf5af2' },
  ];
}

export default function DayProgressWidget({ span = 'span-2x2' }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <WidgetShell span={span} title="Progress">
      <div className="flex flex-1 flex-col justify-around gap-2">
        {progress(now).map((p) => (
          <div key={p.label}>
            <div className="mb-1 flex justify-between">
              <span className="font-medium">{p.label}</span>
              <span className="muted tabular-nums">{Math.floor(p.value * 100)}%</span>
            </div>
            <div className="bar">
              <span style={{ width: `${p.value * 100}%`, background: p.color }} />
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
