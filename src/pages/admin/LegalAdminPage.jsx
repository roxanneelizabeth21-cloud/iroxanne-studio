import LegalPagesAdmin from '@/components/admin/LegalPagesAdmin';

export default function LegalAdminPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Legal Pages</h1>
        <p>Manage your privacy policy, terms, and legal documents.</p>
      </div>
      <div className="irx-card">
        <LegalPagesAdmin />
      </div>
    </div>
  );
}