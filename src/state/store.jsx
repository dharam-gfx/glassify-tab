import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  DEFAULT_TILES,
  DEFAULT_SPACE_PRESETS,
  STARTER_SPACE_TILES,
  STARTER_SPACE_TILE_VERSION,
  sanitizeBg,
} from './defaults';
import { WALLPAPER_KEY, iconKey, loadImage, readBoot, saveImage, storage, writeBoot, writeLocal } from './storage';
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

const spaceTilesKey = (id) => id === 'home' ? 'tiles' : `spaceTiles:${id}`;

function normalizeSpaceConfig(space, fallback) {
  const preset = DEFAULT_SPACE_PRESETS.find((item) => item.id === space.templateId)
    ?? DEFAULT_SPACE_PRESETS.find((item) => item.name.toLowerCase() === space.name?.trim().toLowerCase());
  return {
    layoutWidgets: space.layoutWidgets ? sanitizeLayoutWidgets(space.layoutWidgets) : fallback.layoutWidgets,
    layoutOrder: space.layoutOrder && typeof space.layoutOrder === 'object' ? space.layoutOrder : fallback.layoutOrder,
    widgetSizes: space.widgetSizes && typeof space.widgetSizes === 'object' ? space.widgetSizes : fallback.widgetSizes,
    ...(preset && {
      templateId: preset.id,
      templateTileVersion: Number.isInteger(space.templateTileVersion) ? space.templateTileVersion : 1,
    }),
  };
}

function normalizeSpaces(savedSpaces, legacyConfig, seedPresets) {
  const emptyConfig = {
    layoutWidgets: Object.fromEntries(Object.keys(DEFAULT_SETTINGS.layoutWidgets).map((layout) => [layout, []])),
    layoutOrder: {},
    widgetSizes: {},
  };
  const seen = new Set();
  const spaces = (Array.isArray(savedSpaces) ? savedSpaces : []).flatMap((space) => {
    const id = typeof space?.id === 'string' ? space.id : '';
    const name = typeof space?.name === 'string' ? space.name.trim().slice(0, 24) : '';
    if (!/^[a-z0-9-]{1,40}$/i.test(id) || !name || seen.has(id)) return [];
    seen.add(id);
    const fallback = id === 'home' ? legacyConfig : emptyConfig;
    return [{ id, name: id === 'home' ? 'Home' : name, ...normalizeSpaceConfig(space, fallback) }];
  });
  if (!seen.has('home')) spaces.unshift({ id: 'home', name: 'Home', ...legacyConfig });
  if (seedPresets) {
    for (const preset of DEFAULT_SPACE_PRESETS) {
      if (spaces.some((space) => space.id === preset.id || space.name.toLowerCase() === preset.name.toLowerCase())) continue;
      const layoutWidgets = Object.fromEntries(Object.keys(DEFAULT_SETTINGS.layoutWidgets).map((layout) => [
        layout,
        [...preset.widgetIds],
      ]));
      spaces.push({
        id: preset.id,
        name: preset.name,
        templateId: preset.id,
        templateTileVersion: STARTER_SPACE_TILE_VERSION,
        layoutWidgets,
        layoutOrder: {},
        widgetSizes: {},
      });
    }
  }
  return spaces;
}

function updateActiveSpaceSettings(settings, patch) {
  const next = { ...settings, ...patch };
  const activeConfig = {
    layoutWidgets: next.layoutWidgets,
    layoutOrder: next.layoutOrder,
    widgetSizes: next.widgetSizes,
  };
  return {
    ...next,
    spaces: next.spaces.map((space) => space.id === next.activeSpaceId ? { ...space, ...activeConfig } : space),
  };
}

function mergeSettings(saved) {
  const layoutWidgets = addIntroducedWidgets(sanitizeLayoutWidgets(saved?.layoutWidgets), saved);
  const legacyConfig = {
    layoutWidgets,
    layoutOrder: saved?.layoutOrder ?? {},
    widgetSizes: saved?.widgetSizes ?? {},
  };
  const spaces = normalizeSpaces(saved?.spaces, legacyConfig, saved?.starterSpacesVersion !== 1);
  const activeSpaceId = spaces.some((space) => space.id === saved?.activeSpaceId) ? saved.activeSpaceId : 'home';
  const activeSpace = spaces.find((space) => space.id === activeSpaceId);
  const persistedSettings = { ...saved };
  delete persistedSettings.id;
  delete persistedSettings.name;
  delete persistedSettings.templateId;
  return {
    ...DEFAULT_SETTINGS,
    ...persistedSettings,
    layoutWidgets: activeSpace.layoutWidgets,
    layoutOrder: activeSpace.layoutOrder,
    widgetSizes: activeSpace.widgetSizes,
    spaces,
    activeSpaceId,
    starterSpacesVersion: 1,
    widgetsIntroduced: DEFAULT_SETTINGS.widgetsIntroduced,
  };
}

function createPresetTiles(templateId) {
  const preset = DEFAULT_SPACE_PRESETS.find((item) => item.id === templateId);
  if (!preset) return [];
  return STARTER_SPACE_TILES.filter((tile) => preset.tileIds.includes(tile.id)).map((tile) => ({
    ...tile,
    id: crypto.randomUUID().slice(0, 8),
  }));
}

function addPresetTileUpdates(templateId, tiles) {
  const preset = DEFAULT_SPACE_PRESETS.find((item) => item.id === templateId);
  if (!preset) return tiles;
  const existingUrls = new Set(tiles.map((tile) => tile.url));
  const additions = STARTER_SPACE_TILES
    .filter((tile) => preset.addedTileIds.includes(tile.id) && !existingUrls.has(tile.url))
    .map((tile) => ({ ...tile, id: crypto.randomUUID().slice(0, 8) }));
  return [...tiles, ...additions];
}

function markPresetTileVersion(settings) {
  return {
    ...settings,
    spaces: settings.spaces.map((space) => space.templateId
      ? { ...space, templateTileVersion: STARTER_SPACE_TILE_VERSION }
      : space),
  };
}

function sanitizeBackupTiles(tiles) {
  return (Array.isArray(tiles) ? tiles : [])
    .map((tile) => ({
      id: String(tile?.id ?? crypto.randomUUID().slice(0, 8)).slice(0, 16),
      title: String(tile?.title ?? '').slice(0, 40),
      url: normalizeUrl(tile?.url),
      ...(tile?.group && { group: String(tile.group).slice(0, 30) }),
      ...((tile?.openIn === 'same' || tile?.openIn === 'new') && { openIn: tile.openIn }),
      ...(sanitizeBg(tile?.bg) && { bg: tile.bg }),
    }))
    .filter((tile) => tile.url);
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
    let live = true;
    storage.get('sync', ['settings', 'tiles']).then(async (saved) => {
      const loadedSettings = mergeSettings(saved.settings);
      const tileSets = await Promise.all(loadedSettings.spaces.map(async (space) => {
        const key = spaceTilesKey(space.id);
        const spaceSaved = key === 'tiles' ? saved : await storage.get('sync', [key]);
        if (Array.isArray(spaceSaved[key])) {
          const savedTiles = space.templateId && space.templateTileVersion < STARTER_SPACE_TILE_VERSION
            ? addPresetTileUpdates(space.templateId, spaceSaved[key])
            : spaceSaved[key];
          if (savedTiles !== spaceSaved[key]) await storage.set('sync', { [key]: savedTiles });
          return { key, tiles: savedTiles };
        }
        let fallbackTiles = [];
        if (space.templateId) fallbackTiles = createPresetTiles(space.templateId);
        else if (space.id === 'home') fallbackTiles = DEFAULT_TILES;
        await storage.set('sync', { [key]: fallbackTiles });
        return { key, tiles: fallbackTiles };
      }));
      const nextSettings = markPresetTileVersion(loadedSettings);
      const nextTiles = tileSets.find((set) => set.key === spaceTilesKey(nextSettings.activeSpaceId))?.tiles ?? [];
      if (!live) return;
      setSettings((cur) => (JSON.stringify(cur) === JSON.stringify(nextSettings) ? cur : nextSettings));
      setTiles((cur) => (JSON.stringify(cur) === JSON.stringify(nextTiles) ? cur : nextTiles));
    }).catch((err) => console.warn('Could not load spaces:', err));
    return () => { live = false; };
  }, []);

  usePersist('settings', settings);
  const currentTilesKey = spaceTilesKey(settings?.activeSpaceId ?? 'home');
  useEffect(() => {
    if (tiles == null) return;
    const timer = setTimeout(() => {
      storage.set('sync', { [currentTilesKey]: tiles }).catch((err) => console.warn('Could not save tiles:', err));
    }, 400);
    return () => clearTimeout(timer);
  }, [currentTilesKey, tiles]);

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

  const switchSpace = useCallback(async (id) => {
    if (id === settings.activeSpaceId || !settings.spaces.some((space) => space.id === id)) return;
    await storage.set('sync', { [spaceTilesKey(settings.activeSpaceId)]: tiles ?? [] });
    const key = spaceTilesKey(id);
    const saved = await storage.get('sync', [key]);
    const fallbackTiles = id === 'home' ? DEFAULT_TILES : [];
    const nextTiles = Array.isArray(saved[key]) ? saved[key] : fallbackTiles;
    setSettings((current) => {
      const spaces = current.spaces.map((space) => space.id === current.activeSpaceId
        ? { ...space, layoutWidgets: current.layoutWidgets, layoutOrder: current.layoutOrder, widgetSizes: current.widgetSizes }
        : space);
      const nextSpace = spaces.find((space) => space.id === id);
      return {
        ...current,
        layoutWidgets: nextSpace.layoutWidgets,
        layoutOrder: nextSpace.layoutOrder,
        widgetSizes: nextSpace.widgetSizes,
        spaces,
        activeSpaceId: id,
      };
    });
    setTiles(nextTiles);
    setDrawerOpen(false);
    setEditor(null);
    setEditMode(false);
  }, [settings, tiles]);

  const renameSpace = useCallback((id, name) => {
    const cleanName = name.trim().slice(0, 24);
    if (!cleanName || settings.spaces.some((space) => space.id !== id && space.name.toLowerCase() === cleanName.toLowerCase())) return false;
    setSettings((current) => ({
      ...current,
      spaces: current.spaces.map((space) => space.id === id ? { ...space, name: cleanName } : space),
    }));
    return true;
  }, [settings]);

  const createSpace = useCallback(async (name) => {
    const cleanName = name.trim().slice(0, 24);
    if (!cleanName || settings.spaces.some((space) => space.name.toLowerCase() === cleanName.toLowerCase())) return false;
    const id = `space-${crypto.randomUUID().slice(0, 8)}`;
    const idMap = new Map();
    const nextTiles = await Promise.all((tiles ?? []).map(async (tile) => {
      const tileId = crypto.randomUUID().slice(0, 8);
      idMap.set(tile.id, tileId);
      if (tile.customIcon) {
        const image = await loadImage(iconKey(tile.id));
        if (image) await saveImage(iconKey(tileId), image);
      }
      return { ...tile, id: tileId };
    }));
    const newSpace = {
      id,
      name: cleanName,
      layoutWidgets: settings.layoutWidgets,
      layoutOrder: Object.fromEntries(Object.entries(settings.layoutOrder).map(([layout, order]) => [
        layout,
        Array.isArray(order) ? order.map((item) => idMap.get(item) ?? item) : order,
      ])),
      widgetSizes: settings.widgetSizes,
    };
    await storage.set('sync', { [spaceTilesKey(id)]: nextTiles });
    setSettings((current) => {
      const spaces = current.spaces.map((space) => space.id === current.activeSpaceId
        ? { ...space, layoutWidgets: current.layoutWidgets, layoutOrder: current.layoutOrder, widgetSizes: current.widgetSizes }
        : space);
      return {
        ...current,
        layoutWidgets: newSpace.layoutWidgets,
        layoutOrder: newSpace.layoutOrder,
        widgetSizes: newSpace.widgetSizes,
        spaces: [...spaces, newSpace],
        activeSpaceId: id,
      };
    });
    setTiles(nextTiles);
    setEditor(null);
    setEditMode(false);
    return true;
  }, [settings, tiles]);

  const deleteSpace = useCallback(async (id) => {
    if (id === 'home' || !settings.spaces.some((space) => space.id === id)) return;
    const key = spaceTilesKey(id);
    const saved = id === settings.activeSpaceId ? null : await storage.get('sync', [key]);
    const deletedTiles = id === settings.activeSpaceId ? tiles : saved[key];
    await Promise.all((deletedTiles ?? []).filter((tile) => tile.customIcon).map((tile) => saveImage(iconKey(tile.id), null)));
    await storage.remove('sync', [key]);
    if (id !== settings.activeSpaceId) {
      setSettings((current) => ({ ...current, spaces: current.spaces.filter((space) => space.id !== id) }));
      return;
    }
    const home = settings.spaces.find((space) => space.id === 'home');
    const homeTiles = await storage.get('sync', ['tiles']);
    setSettings((current) => {
      const spaces = current.spaces
        .filter((space) => space.id !== id)
        .map((space) => space.id === current.activeSpaceId
          ? { ...space, layoutWidgets: current.layoutWidgets, layoutOrder: current.layoutOrder, widgetSizes: current.widgetSizes }
          : space);
      return {
        ...current,
        layoutWidgets: home.layoutWidgets,
        layoutOrder: home.layoutOrder,
        widgetSizes: home.widgetSizes,
        spaces,
        activeSpaceId: 'home',
      };
    });
    setTiles(Array.isArray(homeTiles.tiles) ? homeTiles.tiles : DEFAULT_TILES);
    setEditMode(false);
  }, [settings, tiles]);

  // Switching layouts only changes which layout renders; it leaves the user's spacing/style sliders alone.
  const applyPreset = useCallback((preset) => setSettings((s) => ({ ...s, preset })), []);

  const resetSettings = useCallback(() => setSettings((s) => {
    const resetConfig = {
      layoutWidgets: DEFAULT_SETTINGS.layoutWidgets,
      layoutOrder: {},
      widgetSizes: {},
    };
    const spaces = s.spaces.map((space) => space.id === s.activeSpaceId ? { ...space, ...resetConfig } : space);
    return {
      ...DEFAULT_SETTINGS,
      ...resetConfig,
      spaces,
      activeSpaceId: s.activeSpaceId,
    };
  }), []);

  // Only accept known keys of matching type, and tiles with safe http(s) URLs.
  const importBackup = useCallback(async (data) => {
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
    if (!Array.isArray(data.spaces)) {
      next.spaces = [];
      next.activeSpaceId = 'home';
      next.starterSpacesVersion = 0;
    }
    const mergedSettings = mergeSettings(next);
    const importedSpaces = Array.isArray(data.spaces) ? data.spaces : null;
    const tileSets = mergedSettings.spaces.map((space) => {
      const imported = importedSpaces?.find((item) => item.id === space.id);
      let spaceTiles;
      if (Array.isArray(imported?.tiles)) spaceTiles = sanitizeBackupTiles(imported.tiles);
      else if (space.id === mergedSettings.activeSpaceId) spaceTiles = sanitizeBackupTiles(data.tiles);
      else if (space.templateId) spaceTiles = createPresetTiles(space.templateId);
      else spaceTiles = [];
      if (space.templateId && space.templateTileVersion < STARTER_SPACE_TILE_VERSION) {
        spaceTiles = addPresetTileUpdates(space.templateId, spaceTiles);
      }
      return { key: spaceTilesKey(space.id), tiles: spaceTiles };
    });
    const nextSettings = markPresetTileVersion(mergedSettings);
    const activeTiles = tileSets.find((set) => set.key === spaceTilesKey(nextSettings.activeSpaceId))?.tiles ?? [];
    if (!importedSpaces && !activeTiles.length) throw new Error('Backup contains no valid tiles.');
    await Promise.all(tileSets.map((set) => storage.set('sync', { [set.key]: set.tiles })));
    setSettings(nextSettings);
    setTiles(activeTiles);
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
      return updateActiveSpaceSettings(s, { layoutOrder: { ...s.layoutOrder, mosaic: renamed } });
    });
  }, []);

  const moveWidget = useCallback((layout, ids, fromId, toId) => {
    const next = ids.filter((id) => id !== fromId);
    next.splice(next.indexOf(toId), 0, fromId);
    setSettings((s) => updateActiveSpaceSettings(s, { layoutOrder: { ...s.layoutOrder, [layout]: next } }));
  }, []);

  const addWidget = useCallback((layout, id) => {
    setSettings((s) => {
      const current = s.layoutWidgets[layout] ?? [];
      if (current.includes(id)) return s;
      return updateActiveSpaceSettings(s, { layoutWidgets: { ...s.layoutWidgets, [layout]: [...current, id] } });
    });
  }, []);

  const removeWidget = useCallback((layout, id) => {
    setSettings((s) => updateActiveSpaceSettings(s, {
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
      return updateActiveSpaceSettings(s, { widgetSizes: { ...s.widgetSizes, [layout]: forLayout } });
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
      switchSpace,
      renameSpace,
      createSpace,
      deleteSpace,
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
      switchSpace, renameSpace, createSpace, deleteSpace,
        addTile, updateTile, removeTile, moveTile, setTileGridPosition, autoAdjustLayout, setTileGroup, renameGroup, moveWidget, addWidget, removeWidget, setWidgetSize, openEditor, closeEditor]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
