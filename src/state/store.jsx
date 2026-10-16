import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, DEFAULT_TILES, sanitizeBg } from './defaults';
import { WALLPAPER_KEY, iconKey, readBoot, saveImage, storage, writeBoot, writeLocal } from './storage';
import { fontAssets } from '../lib/fonts';

const FONT_BOOT_KEY = 'glassify:fontBoot';
import { normalizeUrl } from '../lib/url';
import { WIDGET_IDS } from '../widgets/catalog';

const StoreContext = createContext(null);

function applyCssVars(s) {
  const root = document.documentElement;
  const tile = Math.round(96 - s.density * 0.48);
  const cellW = tile + 24;
  const available = Math.min(window.innerWidth, s.maxWidth) - s.padX * 2;
  const fit = Math.max(2, Math.floor((available + s.gap) / (cellW + s.gap)));
  const cols = Math.min(s.gridType === 'custom' ? s.columns : 6, fit);

  const vars = {
    '--max-width': `${s.maxWidth}px`,
    '--tile': `${tile}px`,
    '--cols': cols,
    '--gap': `${s.gap}px`,
    '--pad-x': `${s.padX}px`,
    '--pad-y': `${s.padY}px`,
    '--radius': `${s.radius}%`,
    '--widget-radius': `${Math.round(8 + s.radius * 0.6)}px`,
    '--icon-opacity': s.iconOpacity / 100,
    '--favicon-size': `${s.faviconSize}%`,
    '--group-tile': `${s.groupIconSize}px`,
    '--group-favicon-size': `${s.groupFaviconSize}%`,
    '--group-gap': `${s.groupGap}px`,
    '--text-scale': s.textScale / 100,
    '--glass-alpha': s.glassOpacity / 100,
    '--el-pad-x': `${s.elPadX}px`,
    '--el-pad-y': `${s.elPadY}px`,
    '--tile-bg': sanitizeBg(s.tileBg) ?? '#ffffff',
  };
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, String(value));

  const tint = s.glassTint === 'auto' ? (darkScheme.matches ? 'dark' : 'light') : s.glassTint;
  const lightGlass = !s.glass || s.glassOpacity > 55;

  Object.assign(root.dataset, {
    preset: s.preset,
    grid: s.gridType,
    labels: s.labels,
    groupLabels: s.groupLabels ? 'on' : 'off',
    shape: s.iconShape,
    glass: s.glass ? 'on' : 'off',
    tint,
    tone: tint === 'light' && lightGlass ? 'light' : 'dark',
    narrow: String(cols < 4),
  });
  // Fluid grids auto-fill, so the usable column count is whatever fits.
  return s.gridType === 'fluid' ? fit : cols;
}

const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function usePersist(key, value) {
  useEffect(() => {
    if (value == null) return;
    const timer = setTimeout(() => {
      storage.set('sync', { [key]: value }).catch((err) => console.warn(`Could not save ${key}:`, err));
    }, 400);
    return () => clearTimeout(timer);
  }, [key, value]);
}

function sanitizeLayoutWidgets(savedLayouts) {
  const layoutWidgets = { ...DEFAULT_SETTINGS.layoutWidgets };
  if (!savedLayouts || typeof savedLayouts !== 'object') return layoutWidgets;
  for (const layout of Object.keys(layoutWidgets)) {
    const ids = savedLayouts[layout];
    if (Array.isArray(ids)) layoutWidgets[layout] = [...new Set(ids.filter((id) => WIDGET_IDS.includes(id)))];
  }
  return layoutWidgets;
}

function addIntroducedWidgets(layoutWidgets, saved) {
  const introduced = Array.isArray(saved?.widgetsIntroduced) ? saved.widgetsIntroduced : [];
  if (!saved) return layoutWidgets;
  for (const id of DEFAULT_SETTINGS.widgetsIntroduced) {
    if (introduced.includes(id)) continue;
    for (const layout of Object.keys(layoutWidgets)) {
      if (!layoutWidgets[layout].includes(id)) layoutWidgets[layout] = [...layoutWidgets[layout], id];
    }
  }
  return layoutWidgets;
}

function mergeSettings(saved) {
  const layoutWidgets = addIntroducedWidgets(sanitizeLayoutWidgets(saved?.layoutWidgets), saved);
  return { ...DEFAULT_SETTINGS, ...saved, layoutWidgets, widgetsIntroduced: DEFAULT_SETTINGS.widgetsIntroduced };
}

export function StoreProvider({ children }) {
  const [boot] = useState(readBoot);
  const [settings, setSettings] = useState(() => (boot?.settings ? mergeSettings(boot.settings) : null));
  const [tiles, setTiles] = useState(() => (Array.isArray(boot?.tiles) ? boot.tiles : null));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editor, setEditor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [gridCols, setGridCols] = useState(6);

  // chrome.storage.sync stays the source of truth (it syncs across devices); only re-render if it differs.
  useEffect(() => {
    storage.get('sync', ['settings', 'tiles']).then((saved) => {
      const nextSettings = mergeSettings(saved.settings);
      const nextTiles = Array.isArray(saved.tiles) ? saved.tiles : DEFAULT_TILES;
      setSettings((cur) => (JSON.stringify(cur) === JSON.stringify(nextSettings) ? cur : nextSettings));
      setTiles((cur) => (JSON.stringify(cur) === JSON.stringify(nextTiles) ? cur : nextTiles));
    });
  }, []);

  usePersist('settings', settings);
  usePersist('tiles', tiles);

  useEffect(() => {
    if (settings && tiles) writeBoot({ settings, tiles });
  }, [settings, tiles]);

  useLayoutEffect(() => {
    if (!settings) return;
    setGridCols(applyCssVars(settings));
    const onResize = () => setGridCols(applyCssVars(settings));
    window.addEventListener('resize', onResize);
    darkScheme.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      darkScheme.removeEventListener('change', onResize);
    };
  }, [settings]);

  const fontId = settings?.font;
  useLayoutEffect(() => {
    if (!fontId) return;
    const assets = fontAssets(fontId);
    let style = document.getElementById('glassify-font');
    if (!style) {
      style = document.createElement('style');
      style.id = 'glassify-font';
      document.head.appendChild(style);
    }
    style.textContent = assets.css;
    document.documentElement.style.setProperty('--font-stack', assets.stack);
    writeLocal(FONT_BOOT_KEY, JSON.stringify(assets));
  }, [fontId]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);

  // Switching layouts only changes which layout renders; it leaves the user's spacing/style sliders alone.
  const applyPreset = useCallback((preset) => setSettings((s) => ({ ...s, preset })), []);

  const resetSettings = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), []);

  // Only accept known keys of matching type, and tiles with safe http(s) URLs.
  const importBackup = useCallback((data) => {
    if (!data || typeof data !== 'object') throw new Error('Not a Glassify backup file.');
    const next = { ...DEFAULT_SETTINGS };
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      if (typeof data.settings?.[key] === typeof def) next[key] = data.settings[key];
    }
    if (data.settings?.layoutWidgets && typeof data.settings.layoutWidgets === 'object') {
      next.layoutWidgets = { ...DEFAULT_SETTINGS.layoutWidgets };
      for (const layout of Object.keys(next.layoutWidgets)) {
        const ids = data.settings.layoutWidgets[layout];
        if (Array.isArray(ids)) next.layoutWidgets[layout] = ids.filter((id) => WIDGET_IDS.includes(id));
      }
    }
    const tilesIn = Array.isArray(data.tiles) ? data.tiles : [];
    const cleanTiles = tilesIn
      .map((t) => ({
        id: String(t?.id ?? crypto.randomUUID().slice(0, 8)).slice(0, 16),
        title: String(t?.title ?? '').slice(0, 40),
        url: normalizeUrl(t?.url),
        ...(t?.group && { group: String(t.group).slice(0, 30) }),
        ...((t?.openIn === 'same' || t?.openIn === 'new') && { openIn: t.openIn }),
        ...(sanitizeBg(t?.bg) && { bg: t.bg }),
      }))
      .filter((t) => t.url);
    if (!cleanTiles.length) throw new Error('Backup contains no valid tiles.');
    setSettings(next);
    setTiles(cleanTiles);
  }, []);

  const setCustomWallpaper = useCallback(async (dataUrl) => {
    await saveImage(WALLPAPER_KEY, dataUrl);
    setSettings((s) => ({ ...s, wallpaper: 'custom', wallpaperRev: Date.now() }));
  }, []);

  const addTile = useCallback(async (data, iconData) => {
    const id = crypto.randomUUID().slice(0, 8);
    if (iconData) await saveImage(iconKey(id), iconData);
    setTiles((ts) => [...ts, { id, ...data, ...(iconData && { customIcon: true, iconRev: Date.now() }) }]);
  }, []);

  // iconData: undefined = keep, null = remove, string = replace
  const updateTile = useCallback(async (id, data, iconData) => {
    if (iconData !== undefined) await saveImage(iconKey(id), iconData);
    setTiles((ts) =>
      ts.map((t) =>
        t.id !== id
          ? t
          : { ...t, ...data, ...(iconData !== undefined && { customIcon: !!iconData, iconRev: Date.now() }) }
      )
    );
  }, []);

  const removeTile = useCallback((id) => {
    setTiles((ts) => ts.filter((t) => t.id !== id));
    saveImage(iconKey(id), null);
  }, []);

  const moveTile = useCallback((fromId, toId, adoptGroup = false) => {
    setTiles((ts) => {
      const from = ts.findIndex((t) => t.id === fromId);
      const to = ts.findIndex((t) => t.id === toId);
      if (from < 0 || to < 0) return ts;
      const next = [...ts];
      let [moved] = next.splice(from, 1);
      if (adoptGroup) {
        moved = { ...moved };
        delete moved.mosaicPosition;
        delete moved.gridPosition;
        if (ts[to].group) moved.group = ts[to].group;
        else delete moved.group;
      }
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const setTileGridPosition = useCallback((id, position) => {
    setTiles((ts) =>
      ts.map((tile) => {
        if (tile.id !== id) return tile;
        const looseTile = { ...tile, gridPosition: position };
        delete looseTile.group;
        delete looseTile.mosaicPosition;
        return looseTile;
      })
    );
  }, []);

  // Clear manual cell pins so the active grid can compact tiles and fill gaps again.
  const autoAdjustLayout = useCallback(() => {
    setTiles((ts) =>
      ts.map((tile) => {
        if (!tile.gridPosition && !tile.mosaicPosition) return tile;
        const nextTile = { ...tile };
        delete nextTile.gridPosition;
        delete nextTile.mosaicPosition;
        return nextTile;
      })
    );
  }, []);

  const setTileGroup = useCallback((id, group) => {
    setTiles((ts) => {
      const tile = ts.find((t) => t.id === id);
      if (!tile || tile.group === group) return ts;
      const rest = ts.filter((t) => t.id !== id);
      const lastInGroup = rest.findLastIndex((t) => t.group === group);
      rest.splice(lastInGroup + 1 || rest.length, 0, { ...tile, group });
      return rest;
    });
  }, []);

  const renameGroup = useCallback((from, to) => {
    const name = to.trim().slice(0, 30);
    if (!name || name === from) return;
    setTiles((ts) => ts.map((t) => (t.group === from ? { ...t, group: name } : t)));
    setSettings((s) => {
      const order = s.layoutOrder?.mosaic;
      if (!Array.isArray(order)) return s;
      const renamed = order.map((id) => (id === `group:${from}` ? `group:${name}` : id));
      return { ...s, layoutOrder: { ...s.layoutOrder, mosaic: renamed } };
    });
  }, []);

  const moveWidget = useCallback((layout, ids, fromId, toId) => {
    const next = ids.filter((id) => id !== fromId);
    next.splice(next.indexOf(toId), 0, fromId);
    setSettings((s) => ({ ...s, layoutOrder: { ...s.layoutOrder, [layout]: next } }));
  }, []);

  const addWidget = useCallback((layout, id) => {
    setSettings((s) => {
      const current = s.layoutWidgets[layout] ?? [];
      if (current.includes(id)) return s;
      return { ...s, layoutWidgets: { ...s.layoutWidgets, [layout]: [...current, id] } };
    });
  }, []);

  const removeWidget = useCallback((layout, id) => {
    setSettings((s) => ({
      ...s,
      layoutWidgets: { ...s.layoutWidgets, [layout]: (s.layoutWidgets[layout] ?? []).filter((w) => w !== id) },
      layoutOrder: { ...s.layoutOrder, [layout]: (s.layoutOrder[layout] ?? []).filter((w) => w !== id) },
    }));
  }, []);

  const openEditor = useCallback((tile = null, preset = {}) => setEditor({ tile, preset }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  // size null resets the widget to its default size for that layout.
  const setWidgetSize = useCallback((layout, id, size) => {
    setSettings((s) => {
      const forLayout = { ...s.widgetSizes?.[layout] };
      if (size) forLayout[id] = size;
      else delete forLayout[id];
      return { ...s, widgetSizes: { ...s.widgetSizes, [layout]: forLayout } };
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.edit = String(editMode);
  }, [editMode]);

  const value = useMemo(
    () => ({
      ready: !!settings && !!tiles,
      settings,
      tiles,
      update,
      applyPreset,
      resetSettings,
      importBackup,
      setCustomWallpaper,
      addTile,
      updateTile,
      removeTile,
      moveTile,
      setTileGridPosition,
      autoAdjustLayout,
      setTileGroup,
      renameGroup,
      moveWidget,
      addWidget,
      removeWidget,
      setWidgetSize,
      gridCols,
      editMode,
      setEditMode,
      drawerOpen,
      setDrawerOpen,
      editor,
      openEditor,
      closeEditor,
    }),
    [settings, tiles, drawerOpen, editor, editMode, gridCols, update, applyPreset, resetSettings, importBackup, setCustomWallpaper,
        addTile, updateTile, removeTile, moveTile, setTileGridPosition, autoAdjustLayout, setTileGroup, renameGroup, moveWidget, addWidget, removeWidget, setWidgetSize, openEditor, closeEditor]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
