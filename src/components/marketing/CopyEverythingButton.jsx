import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { buildPasteReady, copyText } from '@/lib/marketing';

// CopyEverythingButton — copies caption + hashtags + optional link as one
// paste-ready block. Used on the Today view, Quick Create, and the post editor drawer.
export default function CopyEverythingButton({ post, link, label = 'Copy Everything', size = 'default', variant = 'default', className = '' }) {
  const { toast } = useToast();
  const [done, setDone] = useState(false);

  const handle = async () => {
    const text = buildPasteReady(post, link);
    if (!text) {
      toast({ title: 'Nothing to copy yet', variant: 'destructive' });
      return;
    }
    const ok = await copyText(text);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1500);
      toast({ title: 'Copied to clipboard' });
    } else {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  return (
    <Button type="button" onClick={handle} variant={variant} size={size} className={className}>
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {done ? 'Copied' : label}
    </Button>
  );
}