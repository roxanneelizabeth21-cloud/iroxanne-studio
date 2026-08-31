import { LayoutDashboard } from 'lucide-react';
import PagesForm from '@/components/admin/PagesForm';

export default function SitePageVisibility() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><LayoutDashboard className="h-6 w-6 text-primary" /> Page Visibility</h1>
      <div className="glass rounded-2xl p-6 md:p-8"><PagesForm /></div>
    </div>
  );
}