import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';

// Visual style presets for the banner background + CTA. Keeps the banner on-brand
// (gold/teal/black) regardless of the page it's rendered on.
function getStyle(banner) {
  switch (banner.background_style) {
    case 'gold':
      return {
        background: 'linear-gradient(135deg, #C59F59, #A67B3F)',
        color: '#1a1208',
        muted: 'rgba(26,18,8,0.72)',
        ctaBg: '#0D0D0D',
        ctaColor: '#C59F59',
      };
    case 'teal':
      return {
        background: 'linear-gradient(135deg, #28A49C, #1B575D)',
        color: '#ffffff',
        muted: 'rgba(255,255,255,0.82)',
        ctaBg: '#C59F59',
        ctaColor: '#0D0D0D',
      };
    case 'custom':
      return {
        background: banner.background_color || '#0D0D0D',
        color: '#ffffff',
        muted: 'rgba(255,255,255,0.78)',
        ctaBg: '#C59F59',
        ctaColor: '#0D0D0D',
      };
    case 'dark':
    default:
      return {
        background: '#0D0D0D',
        color: '#f5f5f5',
        muted: 'rgba(245,245,245,0.72)',
        ctaBg: '#C59F59',
        ctaColor: '#0D0D0D',
      };
  }
}

// Single promo banner. The entire banner is clickable to cta_url (internal path
// uses react-router Link; external uses <a target=_blank>). A dismissible banner
// shows an X that calls onDismiss — the caller persists dismissal per device.
export default function PromoBanner({ banner, onDismiss }) {
  if (!banner) return null;
  const s = getStyle(banner);
  const url = banner.cta_url || '';
  const isExternal = /^https?:\/\//i.test(url);

  const Wrapper = url ? (isExternal ? 'a' : Link) : 'div';
  const wrapperProps = url
    ? isExternal
      ? { href: url, target: '_blank', rel: 'noopener noreferrer' }
      : { to: url }
    : {};

  return (
    <div className="w-full" style={{ background: s.background, color: s.color }}>
      <div className="relative max-w-6xl mx-auto px-4 py-3 sm:py-3.5">
        <Wrapper {...wrapperProps} className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 w-full text-center sm:text-left">
          {banner.image_url ? (
            <img
              src={banner.image_url}
              alt=""
              className="w-[60px] h-[60px] rounded-lg object-cover shrink-0"
            />
          ) : null}
          <div className="flex-1 min-w-0">
            {banner.headline ? (
              <p className="font-semibold text-sm sm:text-base leading-tight truncate">
                {banner.headline}
              </p>
            ) : null}
            {banner.subtext ? (
              <p className="text-xs sm:text-sm leading-tight truncate" style={{ color: s.muted }}>
                {banner.subtext}
              </p>
            ) : null}
          </div>
          {banner.cta_text ? (
            <span
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shrink-0"
              style={{ background: s.ctaBg, color: s.ctaColor }}
            >
              {banner.cta_text}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </Wrapper>

        {banner.dismissible && onDismiss ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDismiss();
            }}
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: s.color }}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}