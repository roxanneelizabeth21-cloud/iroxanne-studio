import { User } from 'lucide-react';
import BioForm from '@/components/admin/BioForm';

export default function BioAdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><User className="h-6 w-6 text-primary" /> About Page Bio</h1>
      <div className="glass rounded-2xl p-6 md:p-8"><BioForm /></div>
    </div>
  );
}