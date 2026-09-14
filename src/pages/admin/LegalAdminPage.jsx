import { ScrollText } from 'lucide-react';
import LegalPagesAdmin from '@/components/admin/LegalPagesAdmin';

export default function LegalAdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><ScrollText className="h-6 w-6 text-primary" /> Legal Pages</h1>
      <div className="glass rounded-2xl p-6 md:p-8"><LegalPagesAdmin /></div>
    </div>
  );
}