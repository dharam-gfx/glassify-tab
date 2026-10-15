import { CheckCheck, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { storage } from '../state/storage';
import Ring from './Ring';
import WidgetShell from './WidgetShell';

export default function TasksWidget({ span = 'span-2x2' }) {
  const [tasks, setTasks] = useState(null);
  const [draft, setDraft] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    storage.get('local', ['tasks']).then((r) => {
      setTasks(Array.isArray(r.tasks) ? r.tasks : []);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (loaded.current) storage.set('local', { tasks });
  }, [tasks]);

  const add = (e) => {
    e.preventDefault();
    const text = draft.trim().slice(0, 120);
    if (!text) return;
    setTasks((ts) => [...ts, { id: crypto.randomUUID().slice(0, 8), text, done: false }]);
    setDraft('');
  };

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.done).length ?? 0;
  // Open tasks stay on top; finished ones sink to the bottom.
  const ordered = tasks ? [...tasks.filter((t) => !t.done), ...tasks.filter((t) => t.done)] : [];

  return (
    <WidgetShell
      span={span}
      className="tasks-widget"
      title="Tasks"
      action={
        total > 0 && (
          <span className="flex items-center gap-2">
            {done > 0 && (
              <button className="widget-link" onClick={() => setTasks((ts) => ts.filter((t) => !t.done))}>
                Clear done
              </button>
            )}
            <Ring value={done / total} size={22} stroke={2.5} color="#30d158" />
            <span className="muted tabular-nums">
              {done}/{total}
            </span>
          </span>
        )
      }
    >
      {total === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <CheckCheck size={20} />
          </span>
          <strong>All clear</strong>
          <span className="muted">Add your first task below.</span>
        </div>
      ) : (
        <ul className="task-list">
          {ordered.map((t) => (
            <li key={t.id} className={`task ${t.done ? 'done' : ''}`}>
              <input
                type="checkbox"
                checked={t.done}
                aria-label={t.text}
                onChange={() => setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
              />
              <span className="min-w-0 flex-1 truncate">{t.text}</span>
              <button
                className="remove"
                aria-label={`Remove ${t.text}`}
                onClick={() => setTasks((ts) => ts.filter((x) => x.id !== t.id))}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="pill-input">
        <Plus size={14} className="muted" />
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task" aria-label="New task" maxLength={120} />
        {draft.trim() && (
          <button type="submit" className="pill-submit" aria-label="Add task">
            ↵
          </button>
        )}
      </form>
    </WidgetShell>
  );
}
