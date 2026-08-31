import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { recordVisit } from '@/lib/appVisitHistory';

// Records each in-app page the owner lands on so back arrows can return to the
// previous page visited.
export default function RouteHistoryTracker() {
  const location = useLocation();

  useEffect(() => {
    recordVisit(location.pathname);
  }, [location.pathname]);

  return null;
}