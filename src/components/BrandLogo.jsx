// iRoxanne Studio typographic mark used in admin chrome.
// A text-based "iR" badge keeps branding consistent with the public placeholder
// without depending on the legacy RoxSan PNG asset.
export default function BrandLogo({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-primary/15 border border-primary/30 font-display font-bold text-primary ${className}`}
      aria-label="iRoxanne Studio"
    >
      iR
    </span>
  );
}