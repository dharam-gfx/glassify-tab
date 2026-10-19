import { ArrowUpRight, BookmarkPlus, Check, CheckCheck, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { normalizeUrl } from '../lib/url';
import WidgetShell from './WidgetShell';
import { Chips, DevTitle, useLocalList } from './dev/shared';

const MAX_ITEMS = 50;
const FILTERS = [
  ['unread', 'Unread'],
  ['all', 'All'],
  ['read', 'Read'],
];

function savedLabel(timestamp) {
  const days = Math.floor(Math.max(0, Date.now() - timestamp) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function visibleItems(queue, filter) {
  if (filter === 'read') return queue.filter((item) => item.readAt);
  if (filter === 'all') return queue;
  return queue.filter((item) => !item.readAt);
}

function createQueueItem(urlDraft, titleDraft, queue) {
  const url = normalizeUrl(urlDraft);
  if (!url) return { error: 'Enter a valid web link.' };
  if (queue.some((item) => item.url === url)) return { error: 'That link is already in your queue.' };
  if (queue.length >= MAX_ITEMS) return { error: `Keep your reading queue under ${MAX_ITEMS} links.` };
  const title = titleDraft.trim() || new URL(url).hostname.replace(/^www\./, '');
  return { item: { id: crypto.randomUUID(), title, url, addedAt: Date.now(), readAt: null } };
}

function AddLinkForm({ queue, onSave }) {
  const [urlDraft, setUrlDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [error, setError] = useState('');

  const addLink = (event) => {
    event.preventDefault();
    const result = createQueueItem(urlDraft, titleDraft, queue);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSave(result.item);
    setUrlDraft('');
    setTitleDraft('');
    setError('');
  };

  return (
    <form className="reading-add-form" onSubmit={addLink}>
      <label className="sr-only" htmlFor="reading-queue-url">Article URL</label>
      <input
        id="reading-queue-url"
        className="field"
        type="url"
        value={urlDraft}
        onChange={(event) => setUrlDraft(event.target.value)}
        placeholder="Paste an article link"
        autoComplete="url"
        required
      />
      <label className="sr-only" htmlFor="reading-queue-title">Article title</label>
      <input
        id="reading-queue-title"
        className="field"
        value={titleDraft}
        onChange={(event) => setTitleDraft(event.target.value)}
        placeholder="Title (optional)"
        maxLength={100}
      />
      {error && <span className="reading-error" role="alert">{error}</span>}
      <button className="reading-save-button" type="submit">Save to queue</button>
    </form>
  );
}

function ReadingList({ items, filter, queueLength, onToggle, onRemove }) {
  if (!items.length) {
    const caughtUp = filter === 'unread' && queueLength > 0;
    return (
      <div className="reading-empty">
        {caughtUp ? <CheckCheck size={19} /> : <BookmarkPlus size={19} />}
        <span>{caughtUp ? 'You’re all caught up.' : 'Save an article to read later.'}</span>
      </div>
    );
  }

  return (
    <section className="reading-list-scroll" aria-label="Saved articles">
      <ul className="reading-list">
        {items.slice(0, 20).map((item) => {
          const isRead = !!item.readAt;
          const domain = new URL(item.url).hostname.replace(/^www\./, '');
          return (
            <li className={isRead ? 'is-read' : ''} key={item.id}>
              <div className="reading-item-copy">
                <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={() => !isRead && onToggle(item.id)}>
                  {item.title}
                </a>
                <span>{domain} · {savedLabel(item.addedAt)}</span>
              </div>
              <button className="reading-item-action" type="button" onClick={() => onToggle(item.id)} aria-label={isRead ? `Mark ${item.title} unread` : `Mark ${item.title} read`}>
                {isRead ? <RotateCcw size={14} /> : <Check size={15} />}
              </button>
              <button className="reading-item-action reading-remove" type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.title}`}>
                <Trash2 size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ReadingQueueContent({ queue, unread, visible, filter, setFilter, onToggle, onRemove }) {
  const next = unread[0];
  return (
    <>
      <div className="reading-summary">
        <div>
          <strong>{unread.length}</strong>
          <span>{unread.length === 1 ? ' unread link' : ' unread links'}</span>
        </div>
        {next && (
          <a className="reading-next-button" href={next.url} target="_blank" rel="noopener noreferrer" onClick={() => onToggle(next.id)}>
            Read next <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <Chips value={filter} onChange={setFilter} options={FILTERS} />
      <ReadingList items={visible} filter={filter} queueLength={queue.length} onToggle={onToggle} onRemove={onRemove} />
    </>
  );
}

export default function ReadingQueueWidget({ span = 'span-2x2' }) {
  const [items, save] = useLocalList('readingQueue', []);
  const [filter, setFilter] = useState('unread');
  const [adding, setAdding] = useState(false);
  const queue = items ?? [];
  const unread = queue.filter((item) => !item.readAt);
  const visible = visibleItems(queue, filter);

  const saveNewItem = (item) => {
    save([item, ...queue]);
    setAdding(false);
    setFilter('unread');
  };
  const toggleRead = (id) => save(queue.map((item) => {
    if (item.id !== id) return item;
    return { ...item, readAt: item.readAt ? null : Date.now() };
  }));
  const removeLink = (id) => save(queue.filter((item) => item.id !== id));

  const title = (
    <DevTitle icon={BookmarkPlus} color="#64d2ff">
      Reading Queue
    </DevTitle>
  );
  const action = (
    <button
      className="widget-icon-btn"
      type="button"
      onClick={() => setAdding((open) => !open)}
      aria-label={adding ? 'Close add link form' : 'Add link to reading queue'}
      aria-expanded={adding}
      title={adding ? 'Close' : 'Add link'}
    >
      {adding ? <X size={14} /> : <Plus size={14} />}
    </button>
  );

  return (
    <WidgetShell span={span} className="reading-queue-widget" title={title} action={action}>
      {adding ? (
        <AddLinkForm queue={queue} onSave={saveNewItem} />
      ) : (
        <ReadingQueueContent queue={queue} unread={unread} visible={visible} filter={filter} setFilter={setFilter} onToggle={toggleRead} onRemove={removeLink} />
      )}
    </WidgetShell>
  );
}