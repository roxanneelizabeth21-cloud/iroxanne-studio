import { Image as ImageIcon } from 'lucide-react';
import BannerManager from '@/components/admin/BannerManager';

export default function BannersAdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><ImageIcon className="h-6 w-6 text-primary" /> Page Banners</h1>
      <div className="glass rounded-2xl p-6 md:p-8"><BannerManager /></div>
    </div>
  );
}