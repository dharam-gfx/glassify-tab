import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { iconSources } from '../lib/url';
import { useStore } from '../state/store';

/** Small site icon for list rows; tries the HD source, then Chrome's cache, then a globe. */
export default function SiteIcon({ url, size = 16 }) {
  const { settings } = useStore();
  const sources = iconSources(url, { hd: settings.hdIcons, size: 32 });
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [url, settings.hdIcons]);

  const src = sources[index];
  if (!src) return <Globe size={size} className="muted" />;
  return <img src={src} alt="" width={size} height={size} onError={() => setIndex((i) => i + 1)} />;
}
