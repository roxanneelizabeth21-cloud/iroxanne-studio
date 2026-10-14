import { useId } from 'react';

// Nova's studio identity. Legacy portrait settings stay saved but are not used.
export default function JadeAvatar({ size = 40, className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Nova" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#173f42" /><stop offset="1" stopColor="#071d25" />
        </linearGradient>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#d3fff0" /><stop offset=".55" stopColor="#60c7bb" /><stop offset="1" stopColor="#d7b875" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="62" height="62" rx="21" fill={`url(#${id}-base)`} stroke="#79ada5" strokeOpacity=".35" />
      <ellipse cx="32" cy="32" rx="23" ry="14" transform="rotate(-38 32 32)" fill="none" stroke="#b8e4da" strokeOpacity=".2" />
      <path d="M20 43V22l24 21V22" fill="none" stroke={`url(#${id}-light)`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="47" cy="17" r="3" fill="#dfc58e" />
      <circle cx="47" cy="17" r="6" fill="none" stroke="#dfc58e" strokeOpacity=".18" />
    </svg>
  );
}
