import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Link2 } from 'lucide-react';

// Business-portfolio Pages don't appear in Facebook's Page listing, so the
// Page ID from Meta Business settings is looked up directly and stored.
export default function FacebookPageConnectForm({ onConnected }) {
  const [pageId, setPageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const connect = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('connectFacebookPage', { page_id: pageId.trim() });
      setResult(res?.data || null);
      if (res?.data?.ok) onConnected?.();
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 pt-1">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          placeholder="Facebook Page ID (from Meta Business settings)"
          aria-label="Facebook Page ID"
        />
        <Button onClick={connect} disabled={loading} className="gap-1.5 shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
          {loading ? 'Connecting…' : 'Connect Page'}
        </Button>
      </div>
      {result && (
        <p className={`text-xs ${result.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}