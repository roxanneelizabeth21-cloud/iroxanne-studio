import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import BrandProfilePage from '@/pages/marketing/BrandProfile';
import { SOCIAL_PLATFORMS, isHttpsUrl } from '@/lib/socialPlatforms';
import FacebookConnectionStatus from '@/components/marketing/FacebookConnectionStatus';

const BRAND_FIELDS = ['artist_name', 'voice_description', 'genre_blend', 'audience_description', 'writing_rules', 'hashtag_bank', 'image_style_notes'];

const CELL = 'rounded-xl border-[0.5px] border-border bg-card/60 px-4 py-3';

function Pill({ ok, children }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
      {children}
    </span>
  );
}

// Section 4: a short brand + connection status summary. The full brand form
// opens in a focused drawer instead of living on its own navigation page.
export default function HubBrandConnections({ brandProfile, activeCampaign }) {
  const [open, setOpen] = useState(false);

  const filled = BRAND_FIELDS.filter((f) => String(brandProfile?.[f] || '').trim()).length;
  const completion = Math.round((filled / BRAND_FIELDS.length) * 100);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className={CELL}>
          <p className="text-xs text-muted-foreground">Brand profile</p>
          <p className="text-sm font-medium mt-0.5">{completion}% complete</p>
        </div>
        <div className={CELL}>
          <p className="text-xs text-muted-foreground">Studio identity</p>
          <p className="text-sm font-medium mt-0.5 truncate">{brandProfile?.artist_name || 'iRoxanne Studio'}</p>
        </div>
        <div className={`${CELL} sm:col-span-2`}>
          <p className="text-xs text-muted-foreground">Active campaign visual direction</p>
          <p className="text-sm font-medium mt-0.5 truncate">
            {activeCampaign ? `${activeCampaign.name}${activeCampaign.default_image_style_preset ? ` · ${activeCampaign.default_image_style_preset}` : ' · no style preset set'}` : 'No active campaign'}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {SOCIAL_PLATFORMS.map((p) => {
          const value = brandProfile?.[p.profileField] || '';
          const ok = !!value.trim() && isHttpsUrl(value);
          return (
            <li key={p.id} className={`${CELL} flex items-center justify-between gap-3`}>
              <span className="flex items-center gap-2 text-sm">
                <p.Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {p.label}
              </span>
              <span className="flex items-center gap-2">
                <Pill ok={ok}>{ok ? 'Profile link added' : 'Profile link missing'}</Pill>
                {p.canPublish && <Pill>Direct publishing supported</Pill>}
              </span>
            </li>
          );
        })}
      </ul>

      <FacebookConnectionStatus />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Edit Brand</Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Manage Social Profiles</Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Brand settings</SheetTitle>
            <SheetDescription>Voice, rules, image style, social profile links and reminder emails.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <BrandProfilePage />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}