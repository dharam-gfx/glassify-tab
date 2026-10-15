import { useEffect, useRef, useState } from 'react';
import WidgetShell from './WidgetShell';

const hasSystem = () => typeof chrome !== 'undefined' && !!chrome.system?.cpu && !!chrome.system?.memory;
const GB = 1024 ** 3;

function Gauge({ value, label, color }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const arc = circumference * 0.75;
  const ring = { cx: 32, cy: 32, r, fill: 'none', strokeWidth: 6, strokeLinecap: 'round' };
  const shown = value == null ? '–' : `${Math.round(value)}%`;
  return (
    <div className="gauge">
      <svg viewBox="0 0 64 64" role="img" aria-label={`${label} ${shown}`}>
        <g transform="rotate(135 32 32)">
          <circle {...ring} stroke="currentColor" strokeOpacity="0.15" strokeDasharray={`${arc} ${circumference}`} />
          <circle
            {...ring}
            stroke={color}
            strokeDasharray={`${(arc * (value ?? 0)) / 100} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </g>
        <text x="32" y="36" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">
          {shown}
        </text>
      </svg>
      <span className="muted">{label}</span>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="system-perf-stat flex items-baseline justify-between gap-3">
      <span className="muted">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export default function SystemPerfWidget({ span = 'span-4x2' }) {
  const [stats, setStats] = useState(null);
  const prevCpu = useRef(null);

  useEffect(() => {
    if (!hasSystem()) return;
    let live = true;

    const poll = async () => {
      const [cpu, mem, tabs] = await Promise.all([
        chrome.system.cpu.getInfo(),
        chrome.system.memory.getInfo(),
        chrome.tabs.query({}),
      ]);
      // CPU counters are cumulative, so load is the delta between two samples.
      const totals = cpu.processors.reduce(
        (acc, p) => ({ idle: acc.idle + p.usage.idle, total: acc.total + p.usage.total }),
        { idle: 0, total: 0 }
      );
      const prev = prevCpu.current;
      const cpuLoad =
        prev && totals.total > prev.total ? 100 * (1 - (totals.idle - prev.idle) / (totals.total - prev.total)) : null;
      prevCpu.current = totals;

      if (!live) return;
      setStats((s) => ({
        cpu: cpuLoad ?? s?.cpu ?? null,
        memory: 100 * (1 - mem.availableCapacity / mem.capacity),
        memUsed: (mem.capacity - mem.availableCapacity) / GB,
        memTotal: mem.capacity / GB,
        cores: cpu.numOfProcessors,
        model: cpu.modelName,
        tabs: tabs.length,
      }));
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <WidgetShell
      span={span}
      className="system-perf-widget"
      title="System"
      action={stats?.model && <span className="muted max-w-[60%] truncate">{stats.model}</span>}
    >
      {!hasSystem() ? (
        <p className="muted">System stats are available when running as an extension.</p>
      ) : (
        <div className="system-perf-content grid flex-1 grid-cols-[1fr_1fr_1.3fr] items-center gap-3">
          <Gauge value={stats?.cpu} label="CPU" color="#0a84ff" />
          <Gauge value={stats?.memory} label="Memory" color="#30d158" />
          <div className="system-perf-stats flex flex-col gap-2">
            <Stat label="Cores" value={stats?.cores ?? '–'} />
            <Stat label="RAM" value={stats ? `${stats.memUsed.toFixed(1)}/${stats.memTotal.toFixed(0)} GB` : '–'} />
            <Stat label="Open tabs" value={stats?.tabs ?? '–'} />
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
