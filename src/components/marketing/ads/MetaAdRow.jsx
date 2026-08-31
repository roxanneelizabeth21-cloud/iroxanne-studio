import { ExternalLink } from 'lucide-react';
import MetaStatusToggle from './MetaStatusToggle';

const TONE = {
  ACTIVE: 'bg-accent text-accent-foreground',
  PAUSED: 'bg-secondary text-secondary-foreground',
  CAMPAIGN_PAUSED: 'bg-secondary text-secondary-foreground',
  ADSET_PAUSED: 'bg-secondary text-secondary-foreground',
  DISAPPROVED: 'bg-destructive/15 text-destructive',
  WITH_ISSUES: 'bg-destructive/15 text-destructive',
};

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const num = (n) => Number(n || 0).toLocaleString();

// One ad as it exists in Meta, with its lifetime results.
export default function MetaAdRow({ ad, onChanged }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-3 flex gap-3">
      {ad.thumbnail_url ? (
        <img src={ad.thumbnail_url} alt="" className="h-14 w-14 rounded object-cover bg-muted shrink-0" />
      ) : (
        <div className="h-14 w-14 rounded bg-muted shrink-0" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-2">
          <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">{ad.name}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${TONE[ad.status] || TONE.PAUSED}`}>
            {String(ad.status || '').replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {ad.campaign_name}
          {ad.daily_budget_usd ? ` · ${money(ad.daily_budget_usd)}/day` : ''}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
          <span><span className="text-foreground font-medium">{money(ad.spend)}</span> spent</span>
          <span><span className="text-foreground font-medium">{num(ad.reach)}</span> reached</span>
          <span><span className="text-foreground font-medium">{num(ad.impressions)}</span> views</span>
          <span><span className="text-foreground font-medium">{num(ad.clicks)}</span> clicks</span>
          <span>{Number(ad.ctr || 0).toFixed(2)}% click rate</span>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <MetaStatusToggle id={ad.id} status={ad.status} label="ad" onChanged={onChanged} />
          {ad.preview_url && (
            <a
              href={ad.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              See the ad <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}