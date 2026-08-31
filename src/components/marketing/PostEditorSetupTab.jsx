import { Input } from '@/components/ui/input';
import { FIELD_LABEL } from '@/components/marketing/postEditorFields';
import { PLATFORMS, FORMATS, POST_STATUSES, CONTENT_BUCKETS } from '@/lib/marketing';
import PublishModeToggle from '@/components/marketing/PublishModeToggle';
import PostLinkTargetSelect from '@/components/marketing/PostLinkTargetSelect';
import PlatformScheduleFields from '@/components/marketing/PlatformScheduleFields';

export default function PostEditorSetupTab({ form, set, metrics, setMetrics, showMetrics, setShowMetrics, release }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Platform</label>
          <select value={form.platform} onChange={(e) => set('platform', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Format</label>
          <select value={form.format} onChange={(e) => set('format', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Date</label>
          <Input type="date" value={form.scheduled_date} onChange={(e) => set('scheduled_date', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={FIELD_LABEL}>Time</label>
          <Input type="time" value={form.scheduled_time} onChange={(e) => set('scheduled_time', e.target.value)} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <label className={FIELD_LABEL}>Content bucket</label>
          <select value={form.content_bucket} onChange={(e) => set('content_bucket', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">—</option>
            {CONTENT_BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {form.content_bucket === 'Authentic/Personal' && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">Use your own footage only — clip suggestions are restricted to “My Footage”.</p>
          )}
        </div>
      </div>

      <PlatformScheduleFields form={form} set={set} />

      <PostLinkTargetSelect
        value={form.link_target}
        onChange={(v) => set('link_target', v)}
        release={release}
      />

      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Status</label>
        <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
          {POST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {['Facebook', 'Instagram'].includes(form.platform) && form.status !== 'Posted' && (
          <PublishModeToggle value={form.publish_mode} onChange={(m) => set('publish_mode', m)} />
        )}
      </div>

      {form.status === 'Posted' && (
        <div className="glass rounded-xl p-3 space-y-2">
          <button type="button" className="flex items-center justify-between w-full" onClick={() => setShowMetrics((s) => !s)}>
            <label className={FIELD_LABEL}>Log metrics (optional)</label>
            <span className="text-xs text-muted-foreground">{showMetrics ? 'Hide' : 'Show'}</span>
          </button>
          {showMetrics && (
            <div className="grid grid-cols-5 gap-2">
              {['views', 'likes', 'comments', 'shares', 'saves'].map((k) => (
                <div key={k}>
                  <label className="text-[10px] text-muted-foreground capitalize">{k}</label>
                  <Input type="number" inputMode="numeric" value={metrics[k]} onChange={(e) => setMetrics((m) => ({ ...m, [k]: e.target.value }))} className="h-8 text-sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}