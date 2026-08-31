import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Meta Pixels: Roxsan Music 1723587952279278 + 1861327020888244
// A single fbq('track') call reports to every initialized pixel.
// Base code loads globally in index.html <head> (handles initial load + first PageView).
// This component fires PageView on every SPA route change (including standalone landing pages).
export default function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null;
}