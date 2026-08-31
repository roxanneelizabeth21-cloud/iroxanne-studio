import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

// AdminGuard — enforces admin-only access at the page level.
// - Not signed in → redirect to login and return to the current page after login.
// - Signed in but not an admin → show Access Denied and load no admin data.
// - Admin → render children.
const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
  </div>
);

export default function AdminGuard({ children }) {
  const { user, isAuthenticated, isLoadingAuth, authChecked, checkUserAuth } = useAuth();
  const redirected = useRef(false);

  // Make sure the user's auth state is resolved.
  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  // If resolved and not signed in, send to login and return here afterward.
  useEffect(() => {
    if (authChecked && !redirected.current && (!isAuthenticated || !user)) {
      redirected.current = true;
      // Absolute return URL is required: the auth provider is on a different
      // origin, so a relative path would redirect back to the wrong place and
      // the access token would never reach the app (this breaks login in
      // installed PWAs especially).
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [authChecked, isAuthenticated, user]);

  if (isLoadingAuth || !authChecked) return <Spinner />;
  if (!isAuthenticated || !user) return <Spinner />;

  if (user.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          You need admin access to view this page.
        </p>
        <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
          Back to site
        </Button>
      </div>
    );
  }

  return children;
}