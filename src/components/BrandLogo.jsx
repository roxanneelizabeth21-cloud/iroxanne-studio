// Roxsan full brand logo (R + wordmark + tagline).
// The source PNG is transparent but its gold gradients were designed for a
// dark background. multiply lets the gold tint a light surface (highlights
// drop out, mid-gold/shadows stay visible); in dark mode we revert to normal
// so the gold pops as designed. This keeps the single asset legible in both themes.
const LOGO_URL =
  'https://media.base44.com/images/public/6a048221a7f23eb1bf35a88e/57ebfc4d4_ROXSANLOGONBG.png';

export default function BrandLogo({ className = '' }) {
  return (
    <img
      src={LOGO_URL}
      alt="Roxsan"
      loading="lazy"
      className={`mix-blend-multiply dark:mix-blend-normal object-contain ${className}`}
    />
  );
}