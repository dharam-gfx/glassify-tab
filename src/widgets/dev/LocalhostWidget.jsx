import { Plus, Server, X } from 'lucide-react';
import { useState } from 'react';
import WidgetShell from '../WidgetShell';
import { DevTitle, useLinkProps, useLocalList } from './shared';

const DEFAULT_PORTS = [
  { port: 3000, label: 'App' },
  { port: 5173, label: 'Vite' },
  { port: 8080, label: 'API' },
];
const MAX_PORTS = 8;

export default function LocalhostWidget({ span = 'span-2x2' }) {
  const [ports, save] = useLocalList('localhostPorts', DEFAULT_PORTS);
  const [adding, setAdding] = useState(false);
  const linkProps = useLinkProps();

  const add = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const port = Number(form.get('port'));
    if (!Number.isInteger(port) || port < 1 || port > 65535) return;
    const label = String(form.get('label')).trim().slice(0, 16);
    if (!ports.some((p) => p.port === port)) save([...ports, { port, label }]);
    setAdding(false);
  };

  return (
    <WidgetShell
      span={span}
      className="dev-widget"
      title={
        <DevTitle icon={Server} color="#64d2ff">
          Localhost
        </DevTitle>
      }
      action={
        ports?.length < MAX_PORTS && (
          <button className="widget-icon-btn" onClick={() => setAdding((v) => !v)} aria-label={adding ? 'Cancel' : 'Add port'}>
            {adding ? <X size={14} /> : <Plus size={14} />}
          </button>
        )
      }
    >
      {adding && (
        <form className="pill-input mb-2 mt-0" onSubmit={add}>
          <input name="port" type="number" min="1" max="65535" placeholder="Port" aria-label="Port" className="w-16" required />
          <input name="label" placeholder="Label (optional)" aria-label="Label" autoComplete="off" />
        </form>
      )}
      <div className="port-grid">
        {ports?.map((p) => (
          <div key={p.port} className="port-tile">
            <a href={`http://localhost:${p.port}/`} {...linkProps}>
              <span className="port-number">:{p.port}</span>
              <span className="dev-meta">{p.label || 'localhost'}</span>
            </a>
            <button className="remove" aria-label={`Remove port ${p.port}`} onClick={() => save(ports.filter((x) => x.port !== p.port))}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
