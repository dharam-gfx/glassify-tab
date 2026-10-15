import { Activity } from 'lucide-react';
import { useCached } from '../../lib/cache';
import { allServiceStatus } from '../../lib/devApi';
import WidgetShell from '../WidgetShell';
import { DevTitle, QueryBody, RefreshButton, useLinkProps } from './shared';

const LEVEL = { none: 'ok', minor: 'minor', major: 'major', critical: 'major', maintenance: 'minor', unknown: 'unknown' };

export default function StatusWidget({ span = 'span-2x2' }) {
  const query = useCached('status:all', 5 * 60_000, allServiceStatus);
  const linkProps = useLinkProps();
  const issues = query.data?.filter((s) => s.indicator !== 'none' && s.indicator !== 'unknown').length ?? 0;

  return (
    <WidgetShell
      span={span}
      className="dev-widget"
      title={
        <DevTitle icon={Activity} color="#30d158">
          Service Status
        </DevTitle>
      }
      action={<RefreshButton query={query} />}
    >
      {query.data && (
        <div className={`status-banner ${issues ? 'warn' : 'ok'}`}>
          <span className="status-dot" />
          {issues ? `${issues} service${issues > 1 ? 's' : ''} reporting issues` : 'All systems operational'}
        </div>
      )}
      <QueryBody query={query} rows={5}>
        {(services) => (
          <ul className="status-grid">
            {services.map((s) => (
              <li key={s.id}>
                <a className={`status-item ${LEVEL[s.indicator] ?? 'unknown'}`} href={`https://${s.host}`} title={s.description} {...linkProps}>
                  <span className="status-dot" />
                  <span className="truncate font-medium">{s.name}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </QueryBody>
    </WidgetShell>
  );
}
