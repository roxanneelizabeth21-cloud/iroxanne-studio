import { Trophy, ExternalLink, Pencil, ImageOff } from 'lucide-react';
import MetaStatusToggle from './MetaStatusToggle';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const num = (n) => Number(n || 0).toLocaleString();

// One campaign with its post thumbnail, plain-language results, and controls
// to view the post, edit it in Meta, or pause/resume it.
export default function MetaCampaignRow({ campaign, isBest, adAccountId, onChanged }) {
  const running = campaign.effective_status === 'ACTIVE';
  const editUrl = adAccountId
    ? `https://adsmanager.facebook.com/adsmanager/manage/ads?act=${String(adAccountId).replace(/^act_/, '')}&selected_campaign_ids=${campaign.id}`
    : '';

  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {campaign.thumbnail_url ? (
          <img
            src={campaign.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-16 w-16 rounded-lg object-cover border border-border/60 shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-secondary/60 border border-border/60 shrink-0 flex items-center justify-center">
            <ImageOff className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium leading-snug">{campaign.name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${running ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              {String(campaign.effective_status || '').replace(/_/g, ' ').toLowerCase()}
            </span>
            {isBest && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-foreground inline-flex items-center gap-1">
                <Trophy className="h-3 w-3" /> best click rate
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {campaign.objective.replace(/^OUTCOME_/, '').toLowerCase() || 'campaign'}
            {campaign.daily_budget_usd ? ` · ${money(campaign.daily_budget_usd)}/day` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap sm:shrink-0 sm:justify-end">
            <MetaStatusToggle
              id={campaign.id}
              status={campaign.effective_status}
              label="campaign"
              onChanged={onChanged}
            />
            {campaign.preview_url && (
              <a
                href={campaign.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                View the post <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {editUrl && (
              <a
                href={editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <Pencil className="h-3 w-3" /> Edit in Meta
              </a>
            )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-muted-foreground">
        <div><span className="block text-sm text-foreground font-semibold">{money(campaign.spend)}</span>spent</div>
        <div><span className="block text-sm text-foreground font-semibold">{num(campaign.reach)}</span>people reached</div>
        <div><span className="block text-sm text-foreground font-semibold">{num(campaign.impressions)}</span>views</div>
        <div><span className="block text-sm text-foreground font-semibold">{num(campaign.clicks)}</span>clicks</div>
        <div><span className="block text-sm text-foreground font-semibold">{Number(campaign.ctr || 0).toFixed(2)}%</span>click rate</div>
      </div>
      {campaign.clicks > 0 && (
        <p className="text-[11px] text-muted-foreground">About {money(campaign.spend / campaign.clicks)} per click.</p>
      )}
    </div>
  );
}