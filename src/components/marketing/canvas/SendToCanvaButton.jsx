import { useState } from 'react';
import { Palette, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

// Sends one saved canvas into Canva as an editable design and opens it, so the
// owner can add audio there and bring the finished video back afterwards.
export default function SendToCanvaButton({ imageUrl, title, size = 'sm', variant = 'outline' }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('editInCanva', { image_url: imageUrl, title });
      if (res?.data?.error) throw new Error(res.data.error);
      const url = res?.data?.edit_url;
      if (!url) throw new Error('Canva did not return an edit link');
      window.open(url, '_blank', 'noopener');
      toast({ title: 'Opened in Canva', description: 'Add your audio there, then use “Bring back from Canva”.' });
    } catch (e) {
      toast({ title: 'Could not open Canva', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" size={size} variant={variant} onClick={send} disabled={busy || !imageUrl} className="gap-1.5">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Palette className="h-3.5 w-3.5" />}
      Send to Canva
    </Button>
  );
}