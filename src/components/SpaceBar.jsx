import { Check, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';

export default function SpaceBar() {
  const { settings, switchSpace, renameSpace, createSpace, deleteSpace } = useStore();
  const [creating, setCreating] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [menuSpaceId, setMenuSpaceId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [stuck, setStuck] = useState(false);
  const nameInputRef = useRef(null);
  const addButtonRef = useRef(null);
  const spaceBarRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRefs = useRef(new Map());

  useEffect(() => {
    if (creating || editingSpaceId) nameInputRef.current?.focus();
  }, [creating, editingSpaceId]);

  useEffect(() => {
    const updateStickyState = () => {
      const nextStuck = (spaceBarRef.current?.getBoundingClientRect().top ?? 1) <= 0;
      setStuck((current) => current === nextStuck ? current : nextStuck);
    };
    updateStickyState();
    window.addEventListener('scroll', updateStickyState, { passive: true });
    window.addEventListener('resize', updateStickyState);
    return () => {
      window.removeEventListener('scroll', updateStickyState);
      window.removeEventListener('resize', updateStickyState);
    };
  }, []);

  useEffect(() => {
    if (!creating && !editingSpaceId) return undefined;
    const cancelOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      if (editingSpaceId) {
        const trigger = menuButtonRefs.current.get(editingSpaceId);
        setEditingSpaceId(null);
        setEditingName('');
        setError('');
        trigger?.focus();
        return;
      }
      setCreating(false);
      setName('');
      setError('');
      addButtonRef.current?.focus();
    };
    window.addEventListener('keydown', cancelOnEscape);
    return () => window.removeEventListener('keydown', cancelOnEscape);
  }, [creating, editingSpaceId]);

  useEffect(() => {
    if (!menuSpaceId) return undefined;
    const closeMenu = () => setMenuSpaceId(null);
    const onPointerDown = (event) => {
      const trigger = menuButtonRefs.current.get(menuSpaceId);
      if (menuRef.current?.contains(event.target) || trigger?.contains(event.target)) return;
      closeMenu();
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      const trigger = menuButtonRefs.current.get(menuSpaceId);
      closeMenu();
      trigger?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [menuSpaceId]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const created = await createSpace(name);
      if (!created) {
        setError('A space with that name already exists.');
        return;
      }
      setName('');
      setError('');
      setCreating(false);
    } catch {
      setError('Could not create this space.');
    }
  };

  const submitRename = (event) => {
    event.preventDefault();
    const renamed = renameSpace(editingSpaceId, editingName);
    if (!renamed) {
      setError('That name is already used by another space.');
      return;
    }
    setEditingSpaceId(null);
    setEditingName('');
    setError('');
  };

  const toggleMenu = (spaceId, event) => {
    if (menuSpaceId === spaceId) {
      setMenuSpaceId(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 148;
    setMenuPosition({
      top: Math.min(rect.bottom + 4, window.innerHeight - 100),
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
    });
    setMenuSpaceId(spaceId);
  };

  return (
    <nav ref={spaceBarRef} className={`space-bar${stuck ? ' is-stuck' : ''}`} aria-label="Dashboard spaces">
      <div className="space-tabs">
        {settings.spaces.map((space) => (
          <div className="space-tab-item" key={space.id}>
            {editingSpaceId === space.id ? (
              <form className="space-rename-form" onSubmit={submitRename}>
                <label className="sr-only" htmlFor={`rename-space-${space.id}`}>Rename {space.name} space</label>
                <input
                  ref={nameInputRef}
                  id={`rename-space-${space.id}`}
                  value={editingName}
                  onChange={(event) => {
                    setEditingName(event.target.value);
                    setError('');
                  }}
                  maxLength={24}
                  required
                />
                <button type="submit" aria-label="Save space name" disabled={!editingName.trim()}>
                  <Check size={14} />
                </button>
                {error && <span className="space-create-error" role="alert">{error}</span>}
              </form>
            ) : (
              <>
                <button
                  className="space-tab"
                  type="button"
                  aria-current={settings.activeSpaceId === space.id ? 'page' : undefined}
                  onClick={() => { void switchSpace(space.id); }}
                >
                  {space.name}
                </button>
                {space.id !== 'home' && (
                  <button
                    ref={(node) => {
                      if (node) menuButtonRefs.current.set(space.id, node);
                      else menuButtonRefs.current.delete(space.id);
                    }}
                    className="space-more"
                    type="button"
                    aria-label={`${space.name} space options`}
                    aria-haspopup="menu"
                    aria-expanded={menuSpaceId === space.id}
                    title={`${space.name} options`}
                    onClick={(event) => toggleMenu(space.id, event)}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        <button
            ref={addButtonRef}
          className="space-add"
          type="button"
          aria-label={creating ? 'Cancel adding space' : 'Add space'}
          title={creating ? 'Cancel' : 'Add space'}
          onClick={() => {
            setCreating((current) => !current);
            setError('');
            setName('');
          }}
        >
          {creating ? <X size={15} /> : <Plus size={16} />}
        </button>
        {creating && (
          <form className="space-create-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="new-space-name">New space name</label>
            <input
              ref={nameInputRef}
              id="new-space-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              placeholder="Space name"
              maxLength={24}
              required
            />
            <button type="submit" aria-label="Create space" disabled={!name.trim()}>
              <Check size={15} />
            </button>
            {error && <span className="space-create-error" role="alert">{error}</span>}
          </form>
        )}
      </div>
      {menuSpaceId && menuPosition && (
        <div
          ref={menuRef}
          className="space-menu"
          role="menu"
          aria-label={`${settings.spaces.find((space) => space.id === menuSpaceId)?.name ?? 'Space'} options`}
          style={menuPosition}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const space = settings.spaces.find((item) => item.id === menuSpaceId);
              if (!space) return;
              setEditingSpaceId(space.id);
              setEditingName(space.name);
              setError('');
              setMenuSpaceId(null);
            }}
          >
            <Pencil size={14} /> Rename
          </button>
          <button
            className="is-danger"
            type="button"
            role="menuitem"
            onClick={() => {
              const space = settings.spaces.find((item) => item.id === menuSpaceId);
              setMenuSpaceId(null);
              if (space && window.confirm(`Delete the ${space.name} space?`)) void deleteSpace(space.id);
            }}
          >
            <Trash2 size={14} /> Delete space
          </button>
        </div>
      )}
    </nav>
  );
}
