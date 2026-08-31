import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/downloadFile';
import { toast } from '@/components/ui/use-toast';

export default function DownloadFileButton({ url, filename, icon: Icon, label }) {
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await downloadFile(url, filename);
    } catch {
      toast({ title: 'Download failed', description: 'Try again in a moment.', variant: 'destructive' });
    }
    setBusy(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={save} disabled={busy} className="gap-1.5">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}