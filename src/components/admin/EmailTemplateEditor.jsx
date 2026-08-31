import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Send, Save, AlertTriangle, ArrowLeft } from 'lucide-react';

// Editor for one automated email: subject, body, merge-field reference,
// "send test to myself", and save. A blank field is allowed but warned about —
// sending falls back to the built-in default copy.
export default function EmailTemplateEditor({ template, onBack, onSaved }) {
  const [subject, setSubject] = useState(template.subject || template.default_subject);
  const [body, setBody] = useState(template.body || template.default_body);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const blank = !subject.trim() || !body.trim();

  const save = async () => {
    setSaving(true);
    try {
      const values = { key: template.key, subject, body };
      if (template.record_id) await base44.entities.EmailTemplate.update(template.record_id, values);
      else await base44.entities.EmailTemplate.create(values);
      toast({ title: 'Template saved' });
      onSaved?.();
    } catch (e) {
      toast({ title: "Couldn't save", description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await base44.functions.invoke('sendTemplateTest', { key: template.key });
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      toast({ title: `Test sent to ${data.to}` });
    } catch (e) {
      toast({ title: "Couldn't send test", description: e.message, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All templates
      </button>

      <div>
        <h2 className="font-display text-2xl">{template.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
        <p className="text-xs text-muted-foreground mt-1">Sent to: {template.audience}</p>
      </div>

      {blank && (
        <div className="flex gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <span>This template has an empty {!subject.trim() ? 'subject' : 'body'}. Emails will still send using the original default copy until you fill it in.</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Subject line</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={template.default_subject} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Body</label>
        <p className="text-xs text-muted-foreground">{template.body_label}</p>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder={template.default_body} className="font-mono text-sm" />
      </div>

      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-sm font-medium mb-2">Merge fields you can use here</p>
        <ul className="space-y-1.5">
          {template.merge_fields.map((f) => (
            <li key={f.field} className="text-sm">
              <code className="rounded bg-background px-1.5 py-0.5 text-primary">{f.field}</code>
              <span className="text-muted-foreground"> — {f.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </Button>
        <Button variant="outline" onClick={sendTest} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send test to myself
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Save first — the test email uses the saved version with sample data.</p>
    </div>
  );
}