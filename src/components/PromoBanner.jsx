import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

// Dismissible promotional banner. Renders a single PromoBanner entity.
// Used by the PromoBanners admin form as a live preview and (when wired up)
// by a public banner stack. Dismissal is remembered per device via
// localStorage, keyed to the banner id; previews without an id stay in-memory
// so the admin preview doesn't get stuck dismissed.

const SURFACES = {
  dark: {
    background: 'linear-gradient(90deg, #0D0D0D 0%, #1b1b1b 100%)',
    text: '#ffffff',
  },
  gold: {
    background: 'linear-gradient(90deg, #c9a227 0%, #e8c873 100%)',
    text: '#1a1408',
  },
  teal: {
    background: 'linear-gradient(90deg, #0f3d3a 0%, #176f66 100%)',
    text: '#ffffff',
  },
};

export default function PromoBanner({ banner = {} }) {
  const b = banner || {};
  const key = b.id ? `promo-banner-dismissed:${b.id}` : null;
  const [dismissed, setDismissed] = useState(() => {
    if (!key || !b.dismissible) return false;
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  // Date window check (only when dates are set).
  const today = new Date();
  if (b.start_date && new Date(b.start_date) > today) return null;
  if (b.end_date) {
    const end = new Date(b.end_date);
    end.setHours(23, 59, 59, 999);
    if (end < today) return null;
  }

  const style = b.background_style === 'custom'
    ? { background: b.background_color || '#0D0D0D', color: '#ffffff' }
    : (SURFACES[b.background_style] || SURFACES.dark);

  const cta = b.cta_url;
  const isExternal = /^https?:\/\//i.test(cta || '');

  const dismiss = () => {
    setDismissed(true);
    if (key) {
      try { localStorage.setItem(key, '1'); } catch { /* ignore */ }
    }
  };

  return (
    <div
      style={style}
      className="relative flex items-center gap-4 px-5 py-4 w-full"
      role="region"
      aria-label={b.title || 'Promotional banner'}
    >
      {b.image_url && (
        <img
          src={b.image_url}
          alt=""
          className="hidden sm:block h-12 w-12 shrink-0 rounded-md object-cover"
        />
      )}

      <div className="flex-1 min-w-0">
        {b.headline && (
          <p className="font-semibold text-sm sm:text-base leading-tight">{b.headline}</p>
        )}
        {b.subtext && (
          <p className="text-xs sm:text-sm opacity-80 leading-snug mt-0.5">{b.subtext}</p>
        )}
      </div>

      {b.cta_text && cta && (
        isExternal ? (
          <a
            href={cta}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 transition-colors"
          >
            {b.cta_text}
          </a>
        ) : (
          <Link
            to={cta}
            className="shrink-0 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 transition-colors"
          >
            {b.cta_text}
          </Link>
        )
      )}

      {b.dismissible && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="shrink-0 rounded-full p-1.5 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}