import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { VIDEO_CONTENT_TYPES, SLOT_TYPES, PLATFORMS } from '@/lib/marketing';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

const emptySlot = () => ({ slot_name: '', type: 'text', instructions: '' });

export default function TemplateForm({ initial, onSave, onCancel, saving }) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [content_type, setContentType] = useState(initial?.content_type || 'Lyric Loop');
  const [target_length_seconds, setLength] = useState(initial?.target_length_seconds ?? 12);
  const [platforms, setPlatforms] = useState(initial?.platforms || ['Instagram', 'YouTube', 'Facebook']);
  const [capcut_notes, setCapcut] = useState(initial?.capcut_notes || '');
  const [slots, setSlots] = useState(Array.isArray(initial?.slots) && initial.slots.length ? initial.slots : [emptySlot()]);

  const togglePlatform = (p) => setPlatforms((arr) => arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]);
  const setSlot = (i, k, v) => setSlots((arr) => arr.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  const addSlot = () => setSlots((arr) => [...arr, emptySlot()]);
  const removeSlot = (i) => setSlots((arr) => arr.filter((_, idx) => idx !== i));

  const submit = () => {
    if (!name.trim()) return toast({ title: 'Template name is required', variant: 'destructive' });
    const cleanSlots = slots
      .filter((s) => s.slot_name.trim())
      .map((s) => ({ slot_name: s.slot_name.trim(), type: s.type, instructions: (s.instructions || '').trim() }));
    onSave({
      name: name.trim(),
      description: description.trim(),
      content_type,
      target_length_seconds: Number(target_length_seconds) || 0,
      platforms,
      capcut_notes: capcut_notes.trim(),
      slots: cleanSlots,
    });
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{initial ? 'Edit template' : 'New template'}</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <label className={FL}>Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chorus Loop" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className={FL}>Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Content type</label>
          <select value={content_type} onChange={(e) => setContentType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
            {VIDEO_CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={FL}>Target length (seconds)</label>
          <Input type="number" value={target_length_seconds} onChange={(e) => setLength(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className={FL}>Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button key={p} type="button" onClick={() => togglePlatform(p)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${platforms.includes(p) ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground hover:bg-secondary/50'}`}>{p}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label className={FL}>CapCut notes</label>
          <Textarea value={capcut_notes} onChange={(e) => setCapcut(e.target.value)} rows={2} placeholder="How the matching CapCut template is structured" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={FL}>Slots</label>
          <Button type="button" variant="outline" size="sm" onClick={addSlot} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add slot</Button>
        </div>
        <div className="space-y-2">
          {slots.map((s, i) => (
            <div key={i} className="glass rounded-lg p-3 grid grid-cols-12 gap-2 items-start">
              <div className="col-span-12 sm:col-span-4">
                <label className="text-[10px] text-muted-foreground">Slot name</label>
                <Input value={s.slot_name} onChange={(e) => setSlot(i, 'slot_name', e.target.value)} placeholder="hook_text_frame_one" className="h-8 text-sm" />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="text-[10px] text-muted-foreground">Type</label>
                <select value={s.type} onChange={(e) => setSlot(i, 'type', e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
                  {SLOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="text-[10px] text-muted-foreground">Instructions</label>
                <Input value={s.instructions} onChange={(e) => setSlot(i, 'instructions', e.target.value)} placeholder="What the AI fills here" className="h-8 text-sm" />
              </div>
              <div className="col-span-6 sm:col-span-1 flex sm:justify-end pt-4">
                <button type="button" onClick={() => removeSlot(i)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={submit} disabled={saving} className="gap-2"><Save className="h-4 w-4" /> {initial ? 'Save' : 'Create template'}</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}