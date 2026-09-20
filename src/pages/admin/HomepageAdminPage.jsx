import HomePageSettingsForm from '@/components/admin/HomePageSettingsForm';

export default function HomepageAdminPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Homepage</h1>
        <p>Customize your homepage layout and content.</p>
      </div>
      <div className="irx-card">
        <HomePageSettingsForm />
      </div>
    </div>
  );
}
