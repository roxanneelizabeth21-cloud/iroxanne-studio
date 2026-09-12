import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, Eye, LayoutTemplate, Image, Type, ToggleLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import MediaUploader from './MediaUploader';
import { useToast } from '@/components/ui/use-toast';

const LAYOUTS = [
  { value: 'centered', label: 'Centered Text + Glow' },
  { value: 'cinematic', label: 'Cinematic (Full Bleed)' },
  { value: 'artist_left', label: 'Portrait Left / Text Right' },
  { value: 'artist_right', label: 'Portrait Right / Text Left' },
  { value: 'project_cover', label: 'Showcase Hero' },
  { value: 'video_bg', label: 'Video Background Hero' },
];

const ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const DEFAULTS = {
  hero_title: 'iRoxanne Studio',
  hero_tagline: 'Custom apps for small businesses, solo founders, and creators.',
  hero_primary_button_text: 'Book a consult',
  hero_primary_button_url: '/contact',
  hero_secondary_button_text: 'See the work',
  hero_secondary_button_url: '/work',
  hero_layout_style: 'centered',
  hero_text_alignment: 'center',
  hero_glow_intensity: 10,
  hero_overlay_opacity: 40,
  enable_background_video: false,
  show_featured_project: true,
  show_video_preview: true,
  show_newsletter: true,
  show_gallery_preview: false,
};

function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full relative transition-colors ${value ? 'bg-primary' : 'bg-secondary'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm">{label}</span>
    </label>
  );
}

const INNER_TABS = [
  { value: 'layout', label: 'Layout', icon: LayoutTemplate },
  { value: 'images', label: 'Images', icon: Image },
  { value: 'text', label: 'Text & CTAs', icon: Type },
  { value: 'sections', label: 'Sections', icon: ToggleLeft },
  { value: 'social', label: 'Social', icon: Share2 },
];

function InnerTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-secondary/50 rounded-lg">
      {INNER_TABS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setActiveTab(value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === value
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </button>
      ))}
    </div>
  );
}

export default function HomePageSettingsForm() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('layout');

  const { data: existing = [], isLoading } = useQuery({
    queryKey: ['homepage-settings'],
    queryFn: () => base44.entities.HomePageSettings.list(),
  });

  const record = existing[0] || null;
  const [form, setForm] = useState({ ...DEFAULTS, ...record });
  const [saving, setSaving] = useState(false);

  // Sync when record loads
  useEffect(() => { if (record) setForm({ ...DEFAULTS, ...record }); }, [record?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Featured project picker — stores a PortfolioItem id in featured_portfolio_item_id.
  const { data: projects = [] } = useQuery({
    queryKey: ['portfolio-items-homepage'],
    queryFn: () => base44.entities.PortfolioItem.list('-date_built'),
  });

  const handleSave = async () => {
    setSaving(true);
    if (record?.id) {
      await base44.entities.HomePageSettings.update(record.id, form);
    } else {
      await base44.entities.HomePageSettings.create(form);
    }
    qc.invalidateQueries({ queryKey: ['homepage-settings'] });
    setSaving(false);
    toast({ title: 'Homepage settings saved!' });
  };

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <InnerTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* LAYOUT TAB */}
        {activeTab === 'layout' && <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hero Layout Style</label>
            <Select value={form.hero_layout_style} onValueChange={(v) => set('hero_layout_style', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LAYOUTS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Text Alignment</label>
            <Select value={form.hero_text_alignment} onValueChange={(v) => set('hero_text_alignment', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALIGNMENTS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex justify-between">
              <span>Glow Intensity</span>
              <span className="font-mono text-foreground">{form.hero_glow_intensity ?? 10}</span>
            </label>
            <Slider min={1} max={20} step={1} value={[form.hero_glow_intensity ?? 10]} onValueChange={(v) => set('hero_glow_intensity', v[0])} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex justify-between">
              <span>Background Overlay Opacity</span>
              <span className="font-mono text-foreground">{form.hero_overlay_opacity ?? 40}%</span>
            </label>
            <Slider min={0} max={95} step={5} value={[form.hero_overlay_opacity ?? 40]} onValueChange={(v) => set('hero_overlay_opacity', v[0])} />
          </div>

          {/* Featured Project */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Featured Project Override</label>
            <Select value={form.featured_portfolio_item_id || '__none__'} onValueChange={(v) => set('featured_portfolio_item_id', v === '__none__' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Auto (first featured project)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Auto — use featured flag</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>}

        {/* IMAGES TAB */}
        {activeTab === 'images' && <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hero Background Image</label>
            <p className="text-xs text-muted-foreground">Falls back to animated glow gradient if empty.</p>
            <MediaUploader type="image" currentUrl={form.hero_background_image} onUpload={(url) => set('hero_background_image', url)} placeholder="Upload background image" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Studio / Profile Image</label>
            <p className="text-xs text-muted-foreground">Used in split layouts and cinematic hero.</p>
            <MediaUploader type="image" currentUrl={form.hero_studio_image} onUpload={(url) => set('hero_studio_image', url)} placeholder="Upload studio photo" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">About Headshot</label>
            <p className="text-xs text-muted-foreground">Your portrait shown in the About section on the homepage.</p>
            <MediaUploader type="image" currentUrl={form.about_headshot_url} onUpload={(url) => set('about_headshot_url', url)} placeholder="Upload your headshot" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hero Overlay Graphic</label>
            <p className="text-xs text-muted-foreground">Optional decorative image layered over the background.</p>
            <MediaUploader type="image" currentUrl={form.hero_overlay_image} onUpload={(url) => set('hero_overlay_image', url)} placeholder="Upload overlay graphic (PNG with transparency)" />
          </div>
          <div className="space-y-3 border border-border/50 rounded-xl p-4">
            <Toggle value={form.enable_background_video} onChange={(v) => set('enable_background_video', v)} label="Enable Video Background (overrides images)" />
            {form.enable_background_video && (
              <div className="space-y-2 mt-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">MP4 Video File</label>
                <MediaUploader type="video" currentUrl={form.background_video_file} onUpload={(url) => set('background_video_file', url)} placeholder="Upload MP4 background video" />
              </div>
            )}
          </div>
        </div>}

        {/* TEXT & CTAs TAB */}
        {activeTab === 'text' && <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hero Title</label>
            <Input value={form.hero_title} onChange={(e) => set('hero_title', e.target.value)} placeholder="iRoxanne Studio" />
            <p className="text-xs text-muted-foreground">The last word is automatically highlighted.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tagline</label>
            <Textarea value={form.hero_tagline} onChange={(e) => set('hero_tagline', e.target.value)} rows={2} placeholder="Custom apps for small businesses, solo founders, and creators." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Button Text</label>
              <Input value={form.hero_primary_button_text} onChange={(e) => set('hero_primary_button_text', e.target.value)} placeholder="Book a consult" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Button URL</label>
              <Input value={form.hero_primary_button_url} onChange={(e) => set('hero_primary_button_url', e.target.value)} placeholder="/contact" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Secondary Button Text</label>
              <Input value={form.hero_secondary_button_text} onChange={(e) => set('hero_secondary_button_text', e.target.value)} placeholder="See the work" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Secondary Button URL</label>
              <Input value={form.hero_secondary_button_url} onChange={(e) => set('hero_secondary_button_url', e.target.value)} placeholder="/work" />
            </div>
          </div>
        </div>}

        {/* SECTIONS TAB */}
        {activeTab === 'sections' && <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Toggle homepage sections on or off.</p>
          <div className="space-y-4 p-4 border border-border/50 rounded-xl">
            <Toggle value={form.show_featured_project} onChange={(v) => set('show_featured_project', v)} label="Show Featured Project Banner" />
            <Toggle value={form.show_video_preview} onChange={(v) => set('show_video_preview', v)} label="Show Latest Work Section" />
            <Toggle value={form.show_newsletter} onChange={(v) => set('show_newsletter', v)} label="Show Newsletter Signup" />
            <Toggle value={form.show_gallery_preview} onChange={(v) => set('show_gallery_preview', v)} label="Show Portfolio Preview" />
          </div>
        </div>}

        {/* SOCIAL TAB */}
        {activeTab === 'social' && <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Homepage Social Share Image</label>
            <p className="text-xs text-muted-foreground">Used for OG/Twitter previews when sharing the home page. Falls back to studio image.</p>
            <MediaUploader type="image" currentUrl={form.homepage_social_share_image} onUpload={(url) => set('homepage_social_share_image', url)} placeholder="Upload social share image (1200×630 recommended)" />
          </div>
        </div>}
      </div>

      {/* Save + Preview */}
      <div className="flex gap-3 pt-2 border-t border-border/40">
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Homepage Settings'}
        </Button>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" /> Preview
          </Button>
        </a>
      </div>
    </div>
  );
}