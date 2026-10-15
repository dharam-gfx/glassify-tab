import { Check, ExternalLink, NotebookPen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { storage } from '../state/storage';
import WidgetShell from './WidgetShell';

export default function NotesWidget({ span = 'span-2x2' }) {
  const [text, setText] = useState(null);
  const [saving, setSaving] = useState(false);
  const timer = useRef();

  useEffect(() => {
    storage.get('local', ['notes']).then((r) => setText(r.notes ?? ''));
    return () => clearTimeout(timer.current);
  }, []);

  const write = (value) => {
    setText(value);
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => storage.set('local', { notes: value }).then(() => setSaving(false)), 400);
  };

  const words = text?.trim() ? text.trim().split(/\s+/).length : 0;
  const links = [...new Set((text ?? '').match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) ?? [])]
    .map((raw) => {
      const cleaned = raw.replace(/[),.!?;:]+$/, '');
      const href = cleaned.startsWith('www.') ? `https://${cleaned}` : cleaned;
      try {
        const url = new URL(href);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return { href: url.href, label: url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '') };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, 8);

  return (
    <WidgetShell
      span={span}
      className="notes-widget"
      title={
        <span className="flex items-center gap-2">
          <span className="notes-chip">
            <NotebookPen size={12} />
          </span>
          Notes
        </span>
      }
      action={
        text ? (
          <span className={`notes-status ${saving ? 'saving' : ''}`}>
            {saving ? 'Saving…' : (
              <>
                <Check size={12} /> Saved
              </>
            )}
          </span>
        ) : null
      }
    >
      <div className="notes-paper">
        <textarea
          value={text ?? ''}
          onChange={(e) => write(e.target.value)}
          disabled={text === null}
          placeholder="Jot down an idea, a link, a reminder…"
          aria-label="Notes"
          maxLength={5000}
          spellCheck
        />
      </div>
      {links.length > 0 && (
        <nav className="notes-links" aria-label="Links in note">
          {links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" title={link.href}>
              <ExternalLink size={11} />
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
      )}
      <div className="notes-footer">
        <span className="tabular-nums">
          {words} {words === 1 ? 'word' : 'words'}
        </span>
        {text && (
          <button className="widget-link" onClick={() => window.confirm('Clear this note?') && write('')}>
            Clear
          </button>
        )}
      </div>
    </WidgetShell>
  );
}
