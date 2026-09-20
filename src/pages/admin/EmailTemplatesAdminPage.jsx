import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmailTemplateEditor from '@/components/admin/EmailTemplateEditor';
import { Loader2, Mail, AlertTriangle } from 'lucide-react';

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
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '64px', paddingBottom: '64px' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      {open ? (
        <EmailTemplateEditor
          template={open}
          onBack={() => setOpenKey(null)}
          onSaved={refetch}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="irx-page-header">
            <div className="irx-eyebrow">Business Manager</div>
            <h1>Email Templates</h1>
            <p>Customize automated email templates for your client communications.</p>
          </div>

          <ul className="irx-list">
            {templates.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => setOpenKey(t.key)}
                  className="irx-card"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    border: '1px solid var(--border, #e2e5e3)',
                    background: 'var(--card, #fff)',
                  }}
                >
                  <Mail className="h-4 w-4" style={{ marginTop: '4px', flexShrink: 0, color: 'var(--primary)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                      {t.is_customized && (
                        <span style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderRadius: '4px',
                          background: 'var(--secondary, #f0f2f1)',
                          padding: '2px 6px',
                          color: 'var(--text-secondary, #66736e)',
                        }}>
                          Edited
                        </span>
                      )}
                      {t.empty_fields.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--primary)' }}>
                          <AlertTriangle className="h-3 w-3" /> using default {t.empty_fields.join(' & ')}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary, #66736e)', marginTop: '4px' }}>{t.description}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)', marginTop: '4px' }}>To: {t.audience}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
