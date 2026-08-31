import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TodayPostCard from '@/components/marketing/TodayPostCard';
import PostEditorDrawer from '@/components/marketing/PostEditorDrawer';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import { dateKey, formatDate, platformColor } from '@/lib/marketing';

function addDays(d, n) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + n); return x; }

// Today — the default landing page of the marketing suite. Mobile-first daily workflow:
// today's posts as large cards with a Copy Everything primary button, plus a "coming up"
// strip for the next 3 days. Video posts show the inline assembly checklist.
export default function Today() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const today = dateKey(new Date());

  const { data: posts = [] } = useQuery({ queryKey: ['marketing-posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date') });
  const { data: templates = [] } = useQuery({ queryKey: ['video-templates'], queryFn: () => base44.entities.VideoTemplate.list() });
  const { data: portfolioItems = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list() });

  const dueToday = posts.filter((p) => p.scheduled_date === today && p.status !== 'Skipped' && p.status !== 'Posted');
  const comingUp = [1, 2, 3].map((n) => {
    const key = dateKey(addDays(new Date(), n));
    return { key, label: formatDate(key), posts: posts.filter((p) => p.scheduled_date === key && p.status !== 'Skipped' && p.status !== 'Posted') };
  });

  const regenerate = async (post) => {
    setBusyId(post.id);
    try {
      const res = await base44.functions.invoke('regeneratePost', { post, instruction: undefined });
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      const np = data?.post;
      if (np) {
        await base44.entities.MarketingPost.update(post.id, {
          caption: np.caption || post.caption,
          hashtags: np.hashtags || post.hashtags,
          hook: np.hook || post.hook,
          cta: np.cta || post.cta,
          image_prompt: np.image_prompt || post.image_prompt,
          video_brief: np.video_brief || post.video_brief,
          content_bucket: np.content_bucket || post.content_bucket,
          template_id: np.template_id || post.template_id,
          slot_values: np.slot_values && Object.keys(np.slot_values).length ? np.slot_values : post.slot_values,
        });
        qc.invalidateQueries({ queryKey: ['marketing-posts'] });
        toast({ title: 'Post regenerated' });
      }
    } catch (e) {
      toast({ title: 'Regeneration failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const skip = async (post) => {
    try {
      await base44.entities.MarketingPost.update(post.id, { status: 'Skipped' });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Skipped' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const markPosted = async (post) => {
    try {
      await base44.entities.MarketingPost.update(post.id, { status: 'Posted', posted_at: new Date().toISOString() });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Marked as posted' });
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <HowThisWorks
        steps={[
          'Everything due today shows up as a card, newest plans first.',
          'Copy Everything puts the caption, hashtags and link on your clipboard, ready to paste.',
          'Once it is live, mark it posted — or skip it if today is not the day.',
          'Coming up shows the next three days so nothing sneaks up on you.',
        ]}
        note="Nothing here? Use Create Post to make a one-off."
      />

      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
      </div>

      {dueToday.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="font-medium">Nothing scheduled for today.</p>
          <p className="text-sm text-muted-foreground">Enjoy the day, or use Create Post to make a one-off post.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {dueToday.map((p) => (
            <TodayPostCard
              key={p.id}
              post={p}
              templates={templates}
              portfolioItems={portfolioItems}
              onEdit={setEditing}
              onRegenerate={regenerate}
              onSkip={skip}
              onMarkPosted={markPosted}
              busyId={busyId}
            />
          ))}
        </div>
      )}

      {/* Coming up */}
      <section>
        <h3 className="font-display text-lg font-semibold mb-3">Coming up</h3>
        <div className="space-y-2">
          {comingUp.map((day) => (
            <div key={day.key} className="glass rounded-xl p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{day.label} · {day.posts.length} post{day.posts.length === 1 ? '' : 's'}</p>
              {day.posts.length === 0 ? (
                <p className="text-sm text-muted-foreground/70">—</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {day.posts.map((p) => {
                    const pc = platformColor(p.platform);
                    return (
                      <button key={p.id} onClick={() => setEditing(p)} className={`text-xs rounded px-2 py-1 ${pc.bg} ${pc.text} hover:opacity-80`} title={String(p.hook || p.caption || '').slice(0, 60)}>
                        {p.platform} · {p.format}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {editing && <PostEditorDrawer post={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ['marketing-posts'] })} />}
    </div>
  );
}