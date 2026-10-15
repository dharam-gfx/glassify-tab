import { Code2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import WidgetShell from '../WidgetShell';
import { CopyButton, DevTitle, useLocalList } from './shared';

const DEFAULT_SNIPPETS = [
  { id: 'undo', title: 'Undo last commit (keep changes)', code: 'git reset --soft HEAD~1' },
  { id: 'kill', title: 'Free port 3000', code: 'npx kill-port 3000' },
  { id: 'clean', title: 'Clean reinstall', code: 'rm -rf node_modules package-lock.json && npm install' },
];

export default function SnippetsWidget({ span = 'span-2x2' }) {
  const [snippets, save] = useLocalList('snippets', DEFAULT_SNIPPETS);
  const [adding, setAdding] = useState(false);

  const add = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = String(form.get('code')).trim().slice(0, 2000);
    if (!code) return;
    const title = String(form.get('title')).trim().slice(0, 60) || code.split('\n')[0].slice(0, 40);
    save([{ id: crypto.randomUUID().slice(0, 8), title, code }, ...snippets]);
    setAdding(false);
  };

  return (
    <WidgetShell
      span={span}
      className="dev-widget"
      title={
        <DevTitle icon={Code2} color="#ff375f">
          Snippets
        </DevTitle>
      }
      action={
        <button className="widget-icon-btn" onClick={() => setAdding((v) => !v)} aria-label={adding ? 'Cancel' : 'Add snippet'}>
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      }
    >
      {adding ? (
        <form className="snippet-form" onSubmit={add}>
          <input name="title" className="tool-input" placeholder="Title (optional)" aria-label="Snippet title" autoComplete="off" />
          <textarea name="code" className="tool-input mono" placeholder="Command or code…" aria-label="Snippet code" spellCheck={false} required />
          <button type="submit" className="tool-action">
            Save snippet
          </button>
        </form>
      ) : (
        <ul className="dev-list">
          {snippets?.map((s) => (
            <li key={s.id} className="snippet-row">
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.title}</div>
                <code className="snippet-code">{s.code}</code>
              </div>
              <CopyButton text={s.code} label={`Copy ${s.title}`} />
              <button className="remove" aria-label={`Delete ${s.title}`} onClick={() => save(snippets.filter((x) => x.id !== s.id))}>
                <X size={13} />
              </button>
            </li>
          ))}
          {snippets?.length === 0 && <li className="muted py-2">No snippets yet — add one with +.</li>}
        </ul>
      )}
    </WidgetShell>
  );
}
