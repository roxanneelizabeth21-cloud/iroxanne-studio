import SubscribersAdmin from '@/components/admin/SubscribersAdmin';

export default function SubscribersAdminPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Subscribers</h1>
        <p>Manage your email subscriber list.</p>
      </div>
      <div className="irx-card">
        <SubscribersAdmin />
      </div>
    </div>
  );
}