import { Eye } from 'lucide-react';
import VisitorStats from '@/components/admin/VisitorStats';

export default function VisitorsAdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Eye className="h-6 w-6 text-primary" /> Visitor Analytics</h1>
      <div className="glass rounded-2xl p-6 md:p-8"><VisitorStats /></div>
    </div>
  );
}