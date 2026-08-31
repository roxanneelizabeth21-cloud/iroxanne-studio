import moment from 'moment';
import { Clock } from 'lucide-react';
import { formatPageLabel } from '@/lib/analytics';

export default function RecentVisitsTable({ visits, isLoading }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" /> Recent Visits
      </h3>
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="font-medium py-2 px-2">Landing Page</th>
              <th className="font-medium py-2 px-2">Source</th>
              <th className="font-medium py-2 px-2">Medium</th>
              <th className="font-medium py-2 px-2">Campaign</th>
              <th className="font-medium py-2 px-2">Device</th>
              <th className="font-medium py-2 px-2 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && visits.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No visits recorded yet.</td></tr>
            )}
            {visits.slice(0, 50).map((v) => {
              const ts = v.timestamp || v.created_date;
              return (
                <tr key={v.id} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">{formatPageLabel(v.landing_page || v.current_page)}</td>
                  <td className="py-2 px-2 text-muted-foreground">{v.source || 'Direct / None'}</td>
                  <td className="py-2 px-2 text-muted-foreground">{v.medium || '—'}</td>
                  <td className="py-2 px-2 text-muted-foreground">{v.campaign || '—'}</td>
                  <td className="py-2 px-2 text-muted-foreground">{v.device_type || '—'}</td>
                  <td className="py-2 px-2 text-right text-muted-foreground">{ts ? moment(ts).format('MMM D, h:mm A') : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}