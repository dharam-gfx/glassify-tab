const hasChrome = typeof chrome !== 'undefined' && !!chrome.storage;

// Falls back to localStorage so the UI also runs under `vite dev`.
export const storage = {
  async get(area, keys) {
    if (hasChrome) return chrome.storage[area].get(keys);
    const out = {};
    for (const key of keys) {
      const raw = localStorage.getItem(`${area}:${key}`);
      if (raw != null) out[key] = JSON.parse(raw);
    }
    return out;
  },
  async set(area, items) {
    if (hasChrome) return chrome.storage[area].set(items);
    for (const [key, value] of Object.entries(items)) {
      localStorage.setItem(`${area}:${key}`, JSON.stringify(value));
    }
  },
  async remove(area, keys) {
    if (hasChrome) return chrome.storage[area].remove(keys);
    for (const key of keys) localStorage.removeItem(`${area}:${key}`);
  },
};

const imageCache = new Map();

export async function loadImage(key) {
  if (imageCache.has(key)) return imageCache.get(key);
  const result = await storage.get('local', [key]);
  const value = result[key] ?? null;
  imageCache.set(key, value);
  return value;
}

export async function saveImage(key, dataUrl) {
  imageCache.set(key, dataUrl ?? null);
  if (dataUrl == null) return storage.remove('local', [key]);
  return storage.set('local', { [key]: dataUrl });
}

export const WALLPAPER_KEY = 'wallpaper:custom';
export const iconKey = (id) => `icon:${id}`;

// localStorage mirrors are read synchronously at startup to avoid an empty first frame.
const BOOT_KEY = 'glassify:boot';
export const WP_BOOT_KEY = 'glassify:wpBoot';
export const WP_THUMB_KEY = 'glassify:wpThumb';

export function readBoot() {
  try {
    return JSON.parse(localStorage.getItem(BOOT_KEY) || 'null');
  } catch {
    return null;
  }
}

export function writeBoot(data) {
  try {
    localStorage.setItem(BOOT_KEY, JSON.stringify(data));
  } catch {
    /* quota or privacy mode: startup just falls back to async load */
  }
}

export function writeLocal(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* non-critical cache */
  }
}
