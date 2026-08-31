import { Loader2, Sparkles, Film } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FIELD_LABEL, CopyBtn } from '@/components/marketing/postEditorFields';
import { isVideoFormat } from '@/lib/marketing';
import FirstCommentFields from '@/components/marketing/FirstCommentFields';

export default function PostEditorContentTab({ form, set, instruction, setInstruction, regenerate, regenerating, link }) {
  const isVideo = isVideoFormat(form.format);
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Hook</label>
        <Textarea value={form.hook} onChange={(e) => set('hook', e.target.value)} rows={2} placeholder="Opening line / video hook" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label className={FIELD_LABEL}>Caption</label>
          <div className="flex gap-1.5">
            <CopyBtn label="Caption" getText={() => form.caption} />
            <CopyBtn label="Cap + Tags" getText={() => `${form.caption}\n\n${form.hashtags}`} />
          </div>
        </div>
        <Textarea value={form.caption} onChange={(e) => set('caption', e.target.value)} rows={6} placeholder="Caption text" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={FIELD_LABEL}>Hashtags</label>
          <CopyBtn label="Hashtags" getText={() => form.hashtags} />
        </div>
        <Textarea value={form.hashtags} onChange={(e) => set('hashtags', e.target.value)} rows={2} placeholder="#roxsan #newmusic" />
      </div>

      <div className="space-y-1.5">
        <label className={FIELD_LABEL}>Call to action</label>
        <Input value={form.cta} onChange={(e) => set('cta', e.target.value)} placeholder="Pre-save now" />
      </div>

      <FirstCommentFields form={form} set={set} link={link} />

      <div className="glass rounded-xl p-3 space-y-2">
        <label className={FIELD_LABEL}>Regenerate with AI</label>
        <Input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. make it more playful / shorter / lead with the lyric" />
        <Button type="button" variant="secondary" onClick={regenerate} disabled={regenerating} className="w-full gap-2">
          {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {regenerating ? 'Regenerating…' : 'Regenerate'}
        </Button>
        {isVideo && form.template_id && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Film className="h-3 w-3" /> Keeps the chosen template — use “change template” in the instruction to switch.</p>
        )}
      </div>
    </div>
  );
}