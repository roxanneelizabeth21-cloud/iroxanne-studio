import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

const CTAS = [
  ['LISTEN_NOW', 'Listen now'],
  ['LEARN_MORE', 'Learn more'],
  ['SHOP_NOW', 'Shop now'],
  ['SIGN_UP', 'Sign up'],
  ['WATCH_MORE', 'Watch more'],
];

// Ad account, budget and audience for the paid carousel.
export default function AdSettingsPanel({ form, set, accounts, page }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={FL}>Ad account</label>
          <select value={form.ad_account_id} onChange={(e) => set('ad_account_id', e.target.value)} aria-label="Ad account">
            <option value="">Choose an ad account</option>
            {accounts.map((a) => (
              <option key={a.account_id} value={a.account_id}>{a.name} ({a.currency})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Runs from Page</label>
          <p className="text-sm h-9 flex items-center">{page ? page.name || page.id : 'No Facebook Page connected'}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={FL}>Primary text</label>
        <Textarea value={form.primary_text} onChange={(e) => set('primary_text', e.target.value)} rows={3} placeholder="The text above the carousel" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={FL}>Destination link</label>
          <Input value={form.destination_url} onChange={(e) => set('destination_url', e.target.value)} placeholder="https://iroxannestudio.com/work/..." />
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Button</label>
          <select value={form.cta_type} onChange={(e) => set('cta_type', e.target.value)} aria-label="Call to action button">
            {CTAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <label className={FL}>Daily budget (USD)</label>
          <Input type="number" min="1" step="1" inputMode="decimal" value={form.daily_budget_usd} onChange={(e) => set('daily_budget_usd', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Countries</label>
          <Input value={form.countries} onChange={(e) => set('countries', e.target.value)} placeholder="US, CA, GB" />
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Age from</label>
          <Input type="number" min="13" max="65" value={form.age_min} onChange={(e) => set('age_min', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Age to</label>
          <Input type="number" min="13" max="65" value={form.age_max} onChange={(e) => set('age_max', e.target.value)} />
        </div>
      </div>
    </div>
  );
}