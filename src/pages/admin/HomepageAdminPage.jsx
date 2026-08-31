import HomePageSettingsForm from '@/components/admin/HomePageSettingsForm';

export default function HomepageAdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Homepage</h1>
      <div className="glass rounded-2xl p-6 md:p-8"><HomePageSettingsForm /></div>
    </div>
  );
}