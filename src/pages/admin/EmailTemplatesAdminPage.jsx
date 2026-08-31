import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmailTemplateEditor from '@/components/admin/EmailTemplateEditor';
import { Loader2, Mail, ChevronRight, AlertTriangle } from 'lucide-react';

async function fetchTemplates() {
  const res = await base44.functions.invoke('listEmailTemplates', {});
  const data = res?.data ?? res;
  if (data?.error) throw new Error(data.error);
  return data.templates || [];
}

// Admin page listing every automated email the app sends, with an editor for
// each one's subject and body copy.
export default function EmailTemplatesAdminPage() {
  const [openKey, setOpenKey] = useState(null);
  const { data: templates = [], isLoading, refetch } = useQuery({ queryKey: ['emailTemplates'], queryFn: fetchTemplates });

  const open = templates.find((t) => t.key === openKey);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {open ? (
        <EmailTemplateEditor
          template={open}
          onBack={() => setOpenKey(null)}
          onSaved={refetch}
        />
      ) : (
        <>
          <h1 className="font-display text-2xl sm:text-3xl">Email Templates</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Every automated email the app sends on your behalf. Edit the wording, then send yourself a test.
          </p>
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.key}
                onClick={() => setOpenKey(t.key)}
                className="w-full text-left rounded-xl border border-border bg-card p-4 flex gap-3 items-start hover:border-primary/40 transition-colors"
              >
                <Mail className="h-4 w-4 mt-1 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{t.name}</span>
                    {t.is_customized && <span className="text-[10px] uppercase tracking-wider rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">Edited</span>}
                    {t.empty_fields.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-primary">
                        <AlertTriangle className="h-3 w-3" /> using default {t.empty_fields.join(' & ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">To: {t.audience}</p>
                </div>
                <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}