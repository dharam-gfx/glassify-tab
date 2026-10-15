import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Tile, { TILE_DRAG } from '../components/Tile';
import { useStore } from '../state/store';

function GroupTitle({ name }) {
  const { editMode, renameGroup } = useStore();
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name]);

  if (!editMode) return <h3>{name}</h3>;
  const commit = () => (draft.trim() ? renameGroup(name, draft) : setDraft(name));
  return (
    <input
      className="group-title-input"
      value={draft}
      maxLength={30}
      aria-label="Group name"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(name);
          e.stopPropagation();
        }
      }}
    />
  );
}

export default function AppGroupWidget({ title, tiles }) {
  const { openEditor, setTileGroup } = useStore();
  const [over, setOver] = useState(false);

  return (
    <section
      className={`glass widget app-group${over ? ' drop-target' : ''}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(TILE_DRAG)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(false)}
      onDrop={(e) => {
        const id = e.dataTransfer.getData(TILE_DRAG);
        setOver(false);
        if (!id) return;
        e.preventDefault();
        e.stopPropagation();
        setTileGroup(id, title);
      }}
    >
      <header className="widget-head">
        <GroupTitle name={title} />
        <button className="group-add" onClick={() => openEditor(null, { group: title })} aria-label={`Add tile to ${title}`}>
          <Plus size={14} />
        </button>
      </header>
      <div className="app-group-tiles">
        {tiles.map((t) => (
          <Tile key={t.id} tile={t} groupAware />
        ))}
      </div>
    </section>
  );
}
