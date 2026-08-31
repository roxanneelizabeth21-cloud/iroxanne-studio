import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { resolveIcon } from '@/lib/platformConfig';

const STATUS_CONFIG = {
  visible: { label: 'Visible', className: 'text-emerald-600 bg-emerald-500/10', Icon: Eye },
  hidden: { label: 'Hidden', className: 'text-muted-foreground bg-secondary', Icon: EyeOff },
  missing_url: { label: 'Missing URL', className: 'text-amber-600 bg-amber-500/10', Icon: AlertTriangle },
};

export default function PlatformLinkCard({ link, onSave, onDelete }) {
  const [url, setUrl] = useState(link.url || '');
  const [displayLabel, setDisplayLabel] = useState(link.display_label || '');
  const [sortOrder, setSortOrder] = useState(String(link.sort_order ?? 0));
  const [isVisible, setIsVisible] = useState(link.is_visible || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUrl(link.url || '');
    setDisplayLabel(link.display_label || '');
    setSortOrder(String(link.sort_order ?? 0));
    setIsVisible(link.is_visible || false);
  }, [link.id, link.url, link.display_label, link.sort_order, link.is_visible]);

  const hasUrl = url.trim() !== '';
  const status = isVisible && !hasUrl ? 'missing_url' : isVisible ? 'visible' : 'hidden';
  const dirty =
    url !== (link.url || '') ||
    displayLabel !== (link.display_label || '') ||
    Number(sortOrder) !== (link.sort_order ?? 0) ||
    isVisible !== (link.is_visible || false);

  const Icon = resolveIcon(link.icon_name);
  const { Icon: StatusIcon, label: statusLabel, className: statusClass } = STATUS_CONFIG[status];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...link,
        url: url.trim(),
        display_label: displayLabel,
        sort_order: Number(sortOrder) || 0,
        is_visible: isVisible,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{link.platform_name}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${statusClass}`}>
          <StatusIcon className="h-3 w-3" /> {statusLabel}
        </span>
      </div>

      {status === 'missing_url' && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>This platform is visible but has no URL — it won't appear publicly until you add one.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Display Label</label>
          <Input value={displayLabel} onChange={(e) => setDisplayLabel(e.target.value)} placeholder="Listen on Spotify" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Sort</label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">URL</label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="h-8 text-sm" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Switch checked={isVisible} onCheckedChange={setIsVisible} id={`vis-${link.id}`} />
          <label htmlFor={`vis-${link.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
            {isVisible ? 'Visible publicly' : 'Hidden'}
          </label>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(link)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-8 gap-1.5" onClick={handleSave} disabled={saving || !dirty}>
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}