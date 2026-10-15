import { useEffect, useState } from 'react';
import { WALLPAPERS } from '../lib/wallpapers';
import { WALLPAPER_KEY, WP_BOOT_KEY, WP_THUMB_KEY, loadImage, writeLocal } from '../state/storage';
import { useStore } from '../state/store';

const isImage = (v) => typeof v === 'string' && v.startsWith('data:image/');

export default function Wallpaper() {
  const { settings } = useStore();
  const [custom, setCustom] = useState(null);
  const isCustom = settings.wallpaper === 'custom';

  useEffect(() => {
    if (!isCustom) return;
    let live = true;
    loadImage(WALLPAPER_KEY).then((data) => live && setCustom(data));
    return () => {
      live = false;
    };
  }, [isCustom, settings.wallpaperRev]);

  const preset = WALLPAPERS.find((w) => w.id === settings.wallpaper) ?? WALLPAPERS[0];
  // The tiny thumbnail paints instantly from localStorage while the full image loads from chrome.storage.
  const thumb = isCustom ? localStorage.getItem(WP_THUMB_KEY) : null;
  const image = isCustom ? (isImage(custom) ? custom : isImage(thumb) ? thumb : null) : null;
  const customStyle = isCustom && image
    ? {
        '--photo-opacity': settings.wallpaperOpacity / 100,
        '--photo-blur': `${settings.wallpaperBlur}px`,
        '--photo-overlay': settings.wallpaperOverlay / 100,
      }
    : undefined;

  useEffect(() => {
    writeLocal(WP_BOOT_KEY, isCustom && isImage(thumb) ? `#0b0b12 center / cover no-repeat url("${thumb}")` : preset.css);
  }, [isCustom, thumb, preset.css]);

  return (
    <div className={`wallpaper${isCustom && image ? ' wallpaper-custom' : ''}`} style={isCustom ? customStyle : { background: preset.css }} aria-hidden="true">
      {isCustom && image && <div className="wallpaper-photo" style={{ backgroundImage: `url("${image}")` }} />}
    </div>
  );
}
