import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// Public landing page for the unsubscribe link in fan emails.
export default function Unsubscribe() {
  const email = new URLSearchParams(window.location.search).get('email') || '';
  const [state, setState] = useState('working');

  useEffect(() => {
    if (!email) {
      setState('error');
      return;
    }
    base44.functions
      .invoke('unsubscribeFan', { email })
      .then(() => setState('done'))
      .catch(() => setState('error'));
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center space-y-4">
        {state === 'working' && (
          <>
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Updating your preferences…</p>
          </>
        )}

        {state === 'done' && (
          <>
            <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
            <h1 className="font-display text-2xl">You've been unsubscribed</h1>
            <p className="text-muted-foreground">
              {email} won't receive any more emails from iRoxanne Studio. Sorry to see you go — you're always welcome back.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            <h1 className="font-display text-2xl">Something went wrong</h1>
            <p className="text-muted-foreground">
              We couldn't update your preferences. Please reach out through the contact page and we'll take care of it.
            </p>
          </>
        )}

        <Button asChild variant="outline" className="mt-2">
          <Link to="/">Back to the site</Link>
        </Button>
      </div>
    </div>
  );
}