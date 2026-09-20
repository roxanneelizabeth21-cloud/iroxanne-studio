import VisitorStats from '@/components/admin/VisitorStats';

export default function VisitorsAdminPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Visitors</h1>
        <p>Track and analyze visitor activity on your site.</p>
      </div>
      <div className="irx-card">
        <VisitorStats />
      </div>
    </div>
  );
}
