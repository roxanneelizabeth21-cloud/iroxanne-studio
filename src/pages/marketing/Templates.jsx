import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Film, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_TEMPLATES } from '@/lib/marketing';
import TemplateForm from '@/components/marketing/TemplateForm';
import HowThisWorks from '@/components/marketing/HowThisWorks';

export default function Templates() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | template object
  const [saving, setSaving] = useState(false);
  const inited = useRef(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['video-templates'],
    queryFn: () => base44.entities.VideoTemplate.list('-created_date'),
  });

  // Seed the 5 starter templates on first load if the library is empty.
  useEffect(() => {
    if (isLoading || inited.current) return;
    inited.current = true;
    if (templates.length === 0) {
      (async () => {
        try {
          await base44.entities.VideoTemplate.bulkCreate(DEFAULT_TEMPLATES);
          qc.invalidateQueries({ queryKey: ['video-templates'] });
          toast({ title: '5 starter templates added' });
        } catch (e) {
          toast({ title: 'Failed to seed templates', description: e.message, variant: 'destructive' });
        }
      })();
    }
  }, [isLoading, templates.length]);

  const save = async (data) => {
    setSaving(true);
    try {
      if (editing && editing.id) {
        await base44.entities.VideoTemplate.update(editing.id, data);
        toast({ title: 'Template updated' });
      } else {
        await base44.entities.VideoTemplate.create(data);
        toast({ title: 'Template created' });
      }
      qc.invalidateQueries({ queryKey: ['video-templates'] });
      setEditing(null);
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const del = async (t) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    try {
      await base44.entities.VideoTemplate.delete(t.id);
      qc.invalidateQueries({ queryKey: ['video-templates'] });
      toast({ title: 'Template deleted' });
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (editing) {
    return <TemplateForm initial={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} saving={saving} />;
  }

  return (
    <div className="space-y-4">
      <HowThisWorks
        steps={[
          'A template is the shape of a video: how long it runs and which pieces it needs.',
          'Each piece is a slot — a line of text, a clip, or an image — and the AI fills them in for you.',
          'Use New Template to add your own, or open one to change its slots.',
          'When you write a video post, pick the template and the assembly checklist is built from it.',
        ]}
        note="Five starter templates are added for you the first time you open this page."
      />

      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')} className="gap-2"><Plus className="h-4 w-4" /> New Template</Button>
      </div>

      {templates.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Film className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No templates yet. The starter set will seed automatically, or create your first template above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const slots = Array.isArray(t.slots) ? t.slots : [];
            return (
              <div key={t.id} className="glass rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.content_type} · {t.target_length_seconds || '?'}s · {(t.platforms || []).join('/')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(t)} className="p-1.5 rounded-lg hover:bg-secondary/50"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => del(t)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {t.description && <p className="text-xs text-muted-foreground/80 line-clamp-2">{t.description}</p>}
                {slots.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {slots.map((s, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{s.slot_name}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}