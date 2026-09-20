import BannerManager from '@/components/admin/BannerManager';

export default function BannersAdminPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Banners</h1>
        <p>Manage hero banners displayed on your website.</p>
      </div>
      <div className="irx-card">
        <BannerManager />
      </div>
    </div>
  );
}
