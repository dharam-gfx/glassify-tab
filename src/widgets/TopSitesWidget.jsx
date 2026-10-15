import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import SiteIcon from '../components/SiteIcon';
import { hostOf, normalizeUrl } from '../lib/url';
import WidgetShell from './WidgetShell';

export default function TopSitesWidget({ span = '' }) {
  const [sites, setSites] = useState(null);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.topSites) return setSites([]);
    chrome.topSites.get().then((list) => setSites(list.filter((s) => normalizeUrl(s.url)).slice(0, 6)));
  }, []);

  return (
    <WidgetShell
      span={span}
      title="Most Visited"
    >
      {sites?.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" style={{ color: '#64d2ff', background: 'rgb(100 210 255 / 0.16)' }}>
            <TrendingUp size={18} />
          </span>
          <strong>Start browsing</strong>
          <span className="muted">Sites you visit often will show up here.</span>
        </div>
      )}
      <div className="flex flex-col">
        {sites?.map((s) => (
          <a key={s.url} className="list-row" href={s.url}>
            <SiteIcon url={s.url} />
            <span className="min-w-0 flex-1 truncate font-medium">{s.title || hostOf(s.url)}</span>
            <span className="muted shrink-0">{hostOf(s.url)}</span>
          </a>
        ))}
      </div>
    </WidgetShell>
  );
}
