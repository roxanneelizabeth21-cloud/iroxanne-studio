import { useState } from 'react';
import { Film, Type } from 'lucide-react';
import CaptionEditor from '@/components/marketing/CaptionEditor';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FIELD_LABEL, CopyBtn } from '@/components/marketing/postEditorFields';
import { isVideoFormat } from '@/lib/marketing';
import StylePresetPicker from '@/components/marketing/StylePresetPicker';
import GenerateImagePanel from '@/components/marketing/GenerateImagePanel';
import ColorMatchedVideoPreview from '@/components/marketing/ColorMatchedVideoPreview';
import TemplateSlots from '@/components/marketing/TemplateSlots';
import ClipSuggester from '@/components/marketing/ClipSuggester';

export default function PostEditorMediaTab({
  form, set, setForm, presets, templates, currentTemplate, changeTemplate, changeSlot,
  selectClip, clips, uploadMedia, uploading, release,
}) {
  const isVideo = isVideoFormat(form.format);
  const [captionOpen, setCaptionOpen] = useState(false);
  const isVideoFile = /\.(mp4|mov|m4v|webm|ogg)(\?|#|$)/i.test(form.media_file_url || '');
  return (
    <div className="space-y-5">
      {/* Image prompt + style preset + AI image */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={FIELD_LABEL}>Image prompt</label>
          <CopyBtn label="Image Prompt" getText={() => form.image_prompt} />
        </div>
        <Textarea value={form.image_prompt} onChange={(e) => set('image_prompt', e.target.value)} rows={3} placeholder="Scene description for Canva — no faces, no text" />
        <StylePresetPicker
          presets={presets}
          presetName={form.image_style_preset}
          imagePrompt={form.image_prompt}
          onPresetChange={(name) => set('image_style_preset', name)}
          onImagePromptChange={(p) => set('image_prompt', p)}
        />
        <GenerateImagePanel
          prompt={form.image_prompt}
          attachedUrl={form.media_file_url}
          onUseForPost={(url) => setForm((f) => ({ ...f, media_file_url: url, media_clip_id: '' }))}
        />
      </div>

      {/* Video template + slots + clip matching */}
      {isVideo && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className={FIELD_LABEL}>Video template</label>
            <select value={form.template_id} onChange={(e) => changeTemplate(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">None</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {currentTemplate && (
            <TemplateSlots template={currentTemplate} slotValues={form.slot_values} onChange={changeSlot} />
          )}
          <ClipSuggester post={form} clipAssetId={form.clip_asset_id} onSelectClip={selectClip} />
        </div>
      )}

      {/* Video brief */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={FIELD_LABEL}>Video brief {isVideo ? '' : '(optional)'}</label>
          {isVideo && <CopyBtn label="Brief" getText={() => form.video_brief} />}
        </div>
        <Textarea value={form.video_brief} onChange={(e) => set('video_brief', e.target.value)} rows={3} placeholder="Hook timing, text overlays, cut points" />
      </div>

      {/* Media attachment */}
      <div className="space-y-2">
        <label className={FIELD_LABEL}>Media attachment</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted-foreground">Clip from library</label>
            <select
              value={form.media_clip_id}
              onChange={(e) => setForm((f) => ({ ...f, media_clip_id: e.target.value, media_file_url: e.target.value ? '' : f.media_file_url }))}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">—</option>
              {clips.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted-foreground">Or upload a file</label>
            <label className="flex w-full items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent">
              <Film className="h-3.5 w-3.5" /> {uploading ? 'Uploading…' : 'Choose file'}
              <input type="file" accept="video/*,image/*" className="hidden" onChange={(e) => uploadMedia(e.target.files && e.target.files[0])} />
            </label>
          </div>
        </div>
        {form.media_file_url && isVideoFile && (
          <ColorMatchedVideoPreview src={form.media_file_url} coverUrl={release?.cover_image_url} />
        )}
        {form.media_file_url && (
          <div className="flex items-center gap-2">
            {!isVideoFile && (
              <img src={form.media_file_url} className="h-16 rounded" alt="" />
            )}
            {!isVideoFile && (
              <Button type="button" variant="outline" size="sm" onClick={() => setCaptionOpen(true)} className="gap-1.5">
                <Type className="h-3.5 w-3.5" /> Add caption
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => set('media_file_url', '')} className="text-destructive">Remove</Button>
          </div>
        )}
        {form.media_file_url && !isVideoFile && (
          <CaptionEditor
            asset={{ url: form.media_file_url, title: 'Post image', kind: 'image' }}
            open={captionOpen}
            onOpenChange={setCaptionOpen}
            onDone={(url) => setForm((f) => ({ ...f, media_file_url: url, media_clip_id: '' }))}
          />
        )}
      </div>

    </div>
  );
}