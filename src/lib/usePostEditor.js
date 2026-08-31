import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import {
  isVideoFormat, captureStyleExample, assembleVideoBrief,
} from '@/lib/marketing';
import { shareablePageUrl, defaultLinkTarget } from '@/lib/postLink';

// All post-editing state and actions, extracted so the full-page editor and any
// other surface share one implementation.
export function usePostEditor(post, onDone) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [metrics, setMetrics] = useState({ views: '', likes: '', comments: '', shares: '', saves: '' });

  const { data: templates = [] } = useQuery({ queryKey: ['video-templates'], queryFn: () => base44.entities.VideoTemplate.list('-created_date') });
  const { data: brandProfile } = useQuery({ queryKey: ['brand-profile'], queryFn: () => base44.entities.BrandProfile.list() });
  const presets = (brandProfile && brandProfile[0]?.image_style_presets) || [];
  const { data: clips = [] } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });
  const { data: portfolioItems = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list('-date_built') });

  useEffect(() => {
    if (!post) return;
    setForm({
      platform: post.platform || 'Instagram',
      format: post.format || 'Feed Post',
      content_bucket: post.content_bucket || '',
      scheduled_date: post.scheduled_date || '',
      scheduled_time: post.scheduled_time || '',
      instagram_scheduled_date: post.instagram_scheduled_date || '',
      instagram_scheduled_time: post.instagram_scheduled_time || '',
      facebook_scheduled_date: post.facebook_scheduled_date || '',
      facebook_scheduled_time: post.facebook_scheduled_time || '',
      instagram_first_comment: post.instagram_first_comment || '',
      facebook_first_comment: post.facebook_first_comment || '',
      caption: post.caption || '',
      hashtags: post.hashtags || '',
      hook: post.hook || '',
      cta: post.cta || '',
      image_prompt: post.image_prompt || '',
      image_style_preset: post.image_style_preset || '',
      video_brief: post.video_brief || '',
      template_id: post.template_id || '',
      slot_values: post.slot_values && typeof post.slot_values === 'object' ? post.slot_values : {},
      clip_asset_id: post.clip_asset_id || '',
      media_clip_id: post.media_clip_id || '',
      media_file_url: post.media_file_url || '',
      music_track_id: post.music_track_id || '',
      music_start_seconds: post.music_start_seconds ?? '',
      music_end_seconds: post.music_end_seconds ?? '',
      status: post.status || 'Draft',
      publish_mode: post.publish_mode || 'manual',
      campaign_id: post.campaign_id || '',
      portfolio_item_id: post.portfolio_item_id || '',
      create_post_state: post.create_post_state && typeof post.create_post_state === 'object' ? post.create_post_state : {},
      link_target: post.link_target || '',
      original_ai_caption: post.original_ai_caption || '',
    });
    setInstruction('');
    setShowMetrics(post.status === 'Posted' && !!post.manual_metrics);
    setMetrics({
      views: post.manual_metrics?.views ?? '',
      likes: post.manual_metrics?.likes ?? '',
      comments: post.manual_metrics?.comments ?? '',
      shares: post.manual_metrics?.shares ?? '',
      saves: post.manual_metrics?.saves ?? '',
    });
  }, [post]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['marketing-posts'] });
    qc.invalidateQueries({ queryKey: ['marketing-campaigns'] });
  };

  const currentTemplate = form ? templates.find((t) => t.id === form.template_id) || null : null;
  const portfolioItem = form ? portfolioItems.find((p) => p.id === form.portfolio_item_id) || null : null;
  const appendedLink = form ? shareablePageUrl(portfolioItem, form.link_target || defaultLinkTarget(portfolioItem)) : '';

  const changeTemplate = (id) => {
    const tpl = templates.find((t) => t.id === id) || null;
    const sv = {};
    if (tpl && Array.isArray(tpl.slots)) tpl.slots.forEach((s) => { sv[s.slot_name] = ''; });
    setForm((f) => ({ ...f, template_id: id, slot_values: sv, video_brief: tpl ? assembleVideoBrief(tpl, sv) : '' }));
  };

  const changeSlot = (slotName, value) => {
    setForm((f) => {
      const sv = { ...(f.slot_values || {}), [slotName]: value };
      const vb = currentTemplate ? assembleVideoBrief(currentTemplate, sv) : f.video_brief;
      return { ...f, slot_values: sv, video_brief: vb };
    });
  };

  const selectClip = (clip) => {
    setForm((f) => {
      const sv = { ...(f.slot_values || {}) };
      const tpl = templates.find((t) => t.id === f.template_id);
      const clipSlot = tpl && Array.isArray(tpl.slots) ? tpl.slots.find((s) => s.type === 'clip') : null;
      if (clipSlot) sv[clipSlot.slot_name] = clip.title;
      let vb = f.video_brief;
      if (tpl) vb = assembleVideoBrief(tpl, sv);
      else if (!vb.toLowerCase().includes(clip.title.toLowerCase())) vb = vb ? `${vb} → drop in [${clip.title}]` : `drop in [${clip.title}] → export 9:16`;
      return { ...f, clip_asset_id: clip.id, slot_values: sv, video_brief: vb };
    });
    toast({ title: `Clip “${clip.title}” linked` });
  };

  const uploadMedia = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const file_url = res?.file_url || res?.data?.file_url;
      if (!file_url) throw new Error('No file URL returned');
      setForm((f) => ({ ...f, media_file_url: file_url, media_clip_id: '' }));
      toast({ title: 'Media uploaded' });
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // Numeric/enum fields left blank must not be sent as '' — the API rejects the whole update.
  const cleanNumbers = (payload) => {
    for (const k of ['music_start_seconds', 'music_end_seconds', 'link_target']) {
      if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k];
    }
    return payload;
  };

  const save = async (extra = {}) => {
    setSaving(true);
    try {
      const payload = cleanNumbers({ ...form, ...extra });
      if (!isVideoFormat(form.format)) { payload.template_id = ''; payload.slot_values = {}; payload.clip_asset_id = ''; }
      await base44.entities.MarketingPost.update(post.id, payload);
      if ((form.status === 'Ready' || form.status === 'Posted') && post.status !== form.status) {
        await captureStyleExample(post, form.status, form.caption);
        qc.invalidateQueries({ queryKey: ['style-examples'] });
      }
      toast({ title: 'Post saved' });
      invalidate();
      onDone?.();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const markPosted = async () => {
    const m = {};
    for (const k of ['views', 'likes', 'comments', 'shares', 'saves']) {
      const v = Number(metrics[k]);
      if (!isNaN(v) && String(metrics[k]).trim() !== '') m[k] = v;
    }
    setSaving(true);
    try {
      const payload = cleanNumbers({ ...form, status: 'Posted', posted_at: new Date().toISOString(), manual_metrics: Object.keys(m).length ? m : post.manual_metrics || {} });
      if (!isVideoFormat(form.format)) { payload.template_id = ''; payload.slot_values = {}; payload.clip_asset_id = ''; }
      await base44.entities.MarketingPost.update(post.id, payload);
      if (post.status !== 'Posted') {
        await captureStyleExample(post, 'Posted', form.caption);
        qc.invalidateQueries({ queryKey: ['style-examples'] });
      }
      toast({ title: 'Marked as posted' });
      invalidate();
      onDone?.();
    } catch (e) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const res = await base44.functions.invoke('regeneratePost', {
        post: { ...form, portfolio_item_id: form.portfolio_item_id },
        instruction: instruction.trim() || undefined,
      });
      const data = res?.data ?? res;
      const np = data?.post;
      if (!np) throw new Error('No post returned');
      setForm((f) => ({
        ...f,
        caption: np.caption || f.caption,
        hashtags: np.hashtags || f.hashtags,
        hook: np.hook || f.hook,
        cta: np.cta || f.cta,
        image_prompt: np.image_prompt || f.image_prompt,
        image_style_preset: np.image_style_preset || f.image_style_preset,
        video_brief: np.video_brief || f.video_brief,
        content_bucket: np.content_bucket || f.content_bucket,
        template_id: np.template_id || f.template_id,
        slot_values: np.slot_values && Object.keys(np.slot_values).length ? np.slot_values : f.slot_values,
        original_ai_caption: f.original_ai_caption || np.caption || '',
      }));
      toast({ title: 'Post regenerated' });
    } catch (e) {
      toast({ title: 'Regeneration failed', description: e.message, variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  const del = async () => {
    if (!confirm('Delete this post?')) return;
    setSaving(true);
    try {
      await base44.entities.MarketingPost.delete(post.id);
      toast({ title: 'Post deleted' });
      invalidate();
      onDone?.();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return {
    form, set, setForm, saving, regenerating, instruction, setInstruction,
    showMetrics, setShowMetrics, metrics, setMetrics, uploading,
    templates, presets, clips, currentTemplate,
    portfolioItems, portfolioItem,
    appendedLink,
    changeTemplate, changeSlot, selectClip, uploadMedia,
    save, markPosted, regenerate, del,
  };
}