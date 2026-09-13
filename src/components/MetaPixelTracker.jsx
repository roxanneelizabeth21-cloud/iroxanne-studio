import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const META_PIXEL_ENABLED = false;
// Legacy IDs are preserved in base44/legacy-meta-tracking.txt.
// A single fbq('track') call reports to every initialized pixel.
// Base code loads globally in index.html <head> (handles initial load + first PageView).
// This component fires PageView on every SPA route change (including standalone landing pages).
export default function MetaPixelTracker() {
  const location = useLocation();

  useEffect(() => {
    // Disabled until a Studio-owned pixel is explicitly configured.
    if (META_PIXEL_ENABLED && typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null;
}