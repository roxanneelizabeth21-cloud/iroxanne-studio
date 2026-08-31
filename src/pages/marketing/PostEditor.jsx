import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Loader2, Save, CheckCircle2, Trash2, Type, Image as ImageIcon, CalendarClock, Send, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { platformColor } from '@/lib/marketing';
import { usePostEditor } from '@/lib/usePostEditor';
import PostEditorSection from '@/components/marketing/PostEditorSection';
import PostSubjectSection from '@/components/marketing/PostSubjectSection';
import PostEditorContentTab from '@/components/marketing/PostEditorContentTab';
import PostEditorMediaTab from '@/components/marketing/PostEditorMediaTab';
import PostEditorSetupTab from '@/components/marketing/PostEditorSetupTab';
import CopyEverythingButton from '@/components/marketing/CopyEverythingButton';
import PostPublishPanel from '@/components/marketing/PostPublishPanel';

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: post, isLoading } = useQuery({
    queryKey: ['marketing-post', id],
    queryFn: () => base44.entities.MarketingPost.get(id),
    enabled: !!id,
  });

  const back = () => navigate(-1);
  const ed = usePostEditor(post, back);
  const { form } = ed;

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pc = platformColor(form.platform);
  const edited = post.original_ai_caption && form.caption?.trim() !== post.original_ai_caption?.trim();

  return (
    <div className="pb-28">
      <div className="mb-5 space-y-3">
        <Button variant="ghost" size="sm" onClick={back} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-display font-semibold">
            <span className={`w-3 h-3 rounded-full ${pc.dot}`} />
            {form.platform} · {form.format}
          </h1>
          <p className="text-sm text-muted-foreground">
            {form.scheduled_date || 'No date set'} {form.scheduled_time || ''}
            {edited && <span className="ml-2 text-amber-500">· Edited from AI draft</span>}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 md:items-start">
        <div className="md:col-span-2 space-y-5">
          <PostEditorSection icon={Target} title="What are we marketing?" hint="Start here — pick the portfolio project this post is promoting.">
            <PostSubjectSection
              form={form}
              set={ed.set}
              portfolioItems={ed.portfolioItems}
            />
          </PostEditorSection>

          <PostEditorSection icon={ImageIcon} title="The graphic" hint="Attach the finished graphic or video, or build it from a template.">
            <PostEditorMediaTab
              form={form}
              set={ed.set}
              setForm={ed.setForm}
              presets={ed.presets}
              templates={ed.templates}
              currentTemplate={ed.currentTemplate}
              changeTemplate={ed.changeTemplate}
              changeSlot={ed.changeSlot}
              selectClip={ed.selectClip}
              clips={ed.clips}
              uploadMedia={ed.uploadMedia}
              uploading={ed.uploading}
              release={ed.portfolioItem}
            />
          </PostEditorSection>

          <PostEditorSection icon={Type} title="Content" hint="Hook, caption, hashtags and first comments.">
            <PostEditorContentTab
              form={form}
              set={ed.set}
              instruction={ed.instruction}
              setInstruction={ed.setInstruction}
              regenerate={ed.regenerate}
              regenerating={ed.regenerating}
              link={ed.appendedLink}
            />
          </PostEditorSection>

          <PostEditorSection icon={Send} title="Ready to post" hint="Attach media, approve, share and publish.">
            <PostPublishPanel post={post} />
          </PostEditorSection>
        </div>

        <div className="md:sticky md:top-4 space-y-5">
          <PostEditorSection icon={CalendarClock} title="Schedule & publishing" hint="Dates, times, link and status.">
            <PostEditorSetupTab
              form={form}
              set={ed.set}
              metrics={ed.metrics}
              setMetrics={ed.setMetrics}
              showMetrics={ed.showMetrics}
              setShowMetrics={ed.setShowMetrics}
              release={ed.portfolioItem}
            />
          </PostEditorSection>

        </div>
      </div>

      {/* Actions stay reachable at all times */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/50 bg-background/95 backdrop-blur px-4 py-3 safe-area-pb">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <CopyEverythingButton post={form} link={ed.appendedLink} className="w-full sm:w-auto" />
          <div className="flex min-w-0 flex-1 gap-2">
            <Button onClick={() => ed.save()} disabled={ed.saving} className="flex-1 gap-2">
              {ed.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
            {form.status !== 'Posted' && (
              <Button onClick={ed.markPosted} disabled={ed.saving} variant="secondary" className="flex-1 gap-2">
                <CheckCircle2 className="h-4 w-4" /> Mark Posted
              </Button>
            )}
            <Button onClick={ed.del} disabled={ed.saving} variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete post">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}