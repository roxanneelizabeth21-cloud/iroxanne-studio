import PagesForm from '@/components/admin/PagesForm';

export default function SitePageVisibility() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Pages</h1>
        <p>Manage page visibility and content across your site.</p>
      </div>
      <div className="irx-card">
        <PagesForm />
      </div>
    </div>
  );
}
