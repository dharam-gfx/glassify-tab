import { ImageUp, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { readImage } from '../lib/image';
import { searchSites } from '../lib/siteCatalog';
import { hostOf, normalizeUrl } from '../lib/url';
import { TILE_BGS, sanitizeBg } from '../state/defaults';
import { useStore } from '../state/store';
import SiteIcon from './SiteIcon';
import { TileImage } from './Tile';
import { ColorSwatch, Segmented, Toggle } from '../drawer/controls';

function EditorDialog({ tile, preset, onClose }) {
  const { addTile, updateTile, removeTile, tiles } = useStore();
  const [title, setTitle] = useState(tile?.title ?? '');
  const [url, setUrl] = useState(tile?.url ?? '');
  const [group, setGroup] = useState(tile?.group ?? preset?.group ?? '');
  const [bg, setBg] = useState(tile?.bg ?? '');
  const [openIn, setOpenIn] = useState(tile?.openIn ?? '');
  const [iconText, setIconText] = useState(tile?.iconText ?? '');
  const [preferCachedIcon, setPreferCachedIcon] = useState(!!tile?.preferCachedIcon);
  const [iconMode, setIconMode] = useState(() => {
    if (tile?.customIcon) return 'upload';
    return tile?.iconText ? 'text' : 'favicon';
  });
  // undefined = keep existing icon, null = remove, string = new upload
  const [iconData, setIconData] = useState(undefined);
  const [error, setError] = useState('');
  const [siteQuery, setSiteQuery] = useState('');
  const fileRef = useRef(null);
  const siteResults = tile ? [] : searchSites(siteQuery);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const normalized = normalizeUrl(url);
  const hasCustom = iconMode === 'upload' && (iconData ? true : iconData === undefined && !!tile?.customIcon);
  const previewBg = sanitizeBg(bg);

  const pickSite = (site) => {
    setTitle(site.name);
    setUrl(site.url);
    setSiteQuery('');
  };

  const onIcon = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setIconData(await readImage(file, { max: 256 }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!normalized) return setError('Enter a valid http(s) URL.');
    const data = {
      title: title.trim().slice(0, 40) || hostOf(normalized),
      url: normalized,
      group: group.trim().slice(0, 30) || undefined,
      openIn: openIn || undefined,
      bg: previewBg,
      iconText: iconMode === 'text' ? iconText.trim().toUpperCase().slice(0, 3) || undefined : undefined,
      preferCachedIcon: iconMode === 'favicon' ? preferCachedIcon || undefined : undefined,
    };
    let iconPayload;
    if (iconMode === 'upload') iconPayload = iconData;
    else if (tile?.customIcon) iconPayload = null;
    if (tile) await updateTile(tile.id, data, iconPayload);
    else await addTile(data, iconPayload ?? undefined);
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal studio" onSubmit={onSubmit} role="dialog" aria-modal="true" aria-label={tile ? 'Edit tile' : 'New tile'}>
        <h2 className="studio-title mb-4">{tile ? 'Edit Tile' : 'New Tile'}</h2>

        <div className="mb-4 flex items-center gap-4">
          <span className="tile-icon-wrap" style={{ '--tile': '64px' }}>
            <span className="tile-icon" style={previewBg ? { background: previewBg } : undefined}>
              {iconMode === 'upload' && iconData ? (
                <img className="custom" src={iconData} alt="" />
              ) : (
                <TileImage
                  tile={
                    hasCustom
                      ? { ...tile, bg }
                      : {
                          id: 'preview',
                          title: title || hostOf(normalized),
                          url: normalized ?? '',
                          bg,
                          iconText: iconMode === 'text' ? iconText : undefined,
                          preferCachedIcon: iconMode === 'favicon' ? preferCachedIcon : undefined,
                        }
                  }
                />
              )}
            </span>
          </span>
          <div className="flex-1 flex flex-col gap-2">
            <Segmented
              label="Icon"
              options={[
                { value: 'favicon', label: 'Favicon' },
                { value: 'text', label: 'Initials' },
                { value: 'upload', label: 'Upload' },
              ]}
              value={iconMode}
              onChange={(mode) => {
                setIconMode(mode);
                if (mode === 'upload') fileRef.current?.click();
                else setIconData(tile?.customIcon ? null : undefined);
              }}
            />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onIcon} />
            {iconMode === 'text' && (
              <input
                className="field"
                style={{ width: 140 }}
                value={iconText}
                maxLength={3}
                autoFocus
                onChange={(e) => setIconText(e.target.value.toUpperCase())}
                placeholder="e.g. ABC"
              />
            )}
            {iconMode === 'upload' && (
              <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
                <ImageUp size={14} /> {hasCustom ? 'Replace Image' : 'Choose Image'}
              </button>
            )}
            {iconMode === 'favicon' && (
              <Toggle label="Prefer Cached Icon" checked={preferCachedIcon} onChange={setPreferCachedIcon} />
            )}
          </div>
        </div>

        {!tile && (
          <label className="field-label relative">
            Search for an app
            <input
              className="field"
              value={siteQuery}
              autoFocus
              onChange={(e) => setSiteQuery(e.target.value)}
              placeholder="e.g. Notion, GitHub, Spotify…"
            />
            {siteResults.length > 0 && (
              <div className="studio site-results" role="listbox">
                {siteResults.map((site) => (
                  <button
                    key={site.url}
                    type="button"
                    role="option"
                    aria-selected="false"
                    className="list-row"
                    onClick={() => pickSite(site)}
                  >
                    <SiteIcon url={site.url} />
                    <span className="flex-1 text-left font-medium">{site.name}</span>
                  </button>
                ))}
              </div>
            )}
          </label>
        )}

        <label className="field-label">
          Tile Name
          <input className="field" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
        </label>
        <label className="field-label">
          URL
          <input
            className="field"
            value={url}
            required
            autoFocus={!!tile}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            inputMode="url"
          />
        </label>
        <label className="field-label">
          Group (used by Spatial Mosaic)
          <input className="field" list="glassify-groups" value={group} maxLength={30} onChange={(e) => setGroup(e.target.value)} placeholder="e.g. Creative Apps" />
        </label>
        <datalist id="glassify-groups">
          {[...new Set(tiles.map((t) => t.group).filter(Boolean))].map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>

        <div className="mb-3">
          <Segmented
            label="Open In"
            options={[
              { value: '', label: 'Default' },
              { value: 'same', label: 'Same Tab' },
              { value: 'new', label: 'New Tab' },
            ]}
            value={openIn}
            onChange={setOpenIn}
          />
        </div>

        <div className="field-label mb-2">Tile Background</div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" className="btn h-7 px-2" aria-pressed={!bg} onClick={() => setBg('')}>
            Global
          </button>
          {TILE_BGS.map((b) => (
            <button
              key={b}
              type="button"
              className="swatch"
              style={{ background: b }}
              aria-pressed={bg === b}
              aria-label={`Background ${b}`}
              onClick={() => setBg(b)}
            />
          ))}
          <ColorSwatch value={bg} active={!!bg && !TILE_BGS.includes(bg)} onChange={setBg} label="Custom background colour" />
        </div>

        {error && <p className="hint error mb-3">{error}</p>}

        <div className="flex items-center gap-2">
          {tile && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                removeTile(tile.id);
                onClose();
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
          <span className="flex-1" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {tile ? 'Save' : 'Add Tile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TileEditorModal() {
  const { editor, closeEditor } = useStore();
  if (!editor) return null;
  return <EditorDialog key={editor.tile?.id ?? 'new'} tile={editor.tile} preset={editor.preset} onClose={closeEditor} />;
}
