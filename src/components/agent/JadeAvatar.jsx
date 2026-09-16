// Jade's face. Same portrait she has on the music side, so she reads as one
// person across both studios. Uses the owner's chosen picture when one is saved
// on the BrandProfile; otherwise the built-in illustrated avatar.
export default function JadeAvatar({ src, size = 40, className = '' }) {
  if (src) {
    return <img src={src} alt="Sam" width={size} height={size} className={`rounded-full object-cover shrink-0 ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Sam" className={`rounded-full shrink-0 ${className}`}>
      <defs>
        <linearGradient id="jade-bg-studio" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f6f5f" />
          <stop offset="1" stopColor="#0f3d35" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#jade-bg-studio)" />
      {/* hair */}
      <ellipse cx="32" cy="27" rx="19" ry="17" fill="#2b1a12" />
      <circle cx="16" cy="30" r="7" fill="#2b1a12" />
      <circle cx="48" cy="30" r="7" fill="#2b1a12" />
      <circle cx="20" cy="20" r="6" fill="#2b1a12" />
      <circle cx="44" cy="20" r="6" fill="#2b1a12" />
      {/* shoulders */}
      <path d="M12 64c2-12 10-17 20-17s18 5 20 17z" fill="#e8c46a" />
      {/* neck + face */}
      <rect x="27" y="38" width="10" height="9" rx="4" fill="#8a5a3c" />
      <ellipse cx="32" cy="30" rx="12.5" ry="14" fill="#9c6a48" />
      {/* eyes */}
      <ellipse cx="27" cy="30" rx="1.6" ry="2" fill="#1a1a1a" />
      <ellipse cx="37" cy="30" rx="1.6" ry="2" fill="#1a1a1a" />
      <path d="M24.5 27.2c1.5-1.4 3.5-1.4 5 0" stroke="#2b1a12" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M34.5 27.2c1.5-1.4 3.5-1.4 5 0" stroke="#2b1a12" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* smile */}
      <path d="M27.5 36c2.5 2.6 6.5 2.6 9 0" stroke="#4a2418" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* earrings */}
      <circle cx="19.5" cy="35" r="1.6" fill="#e8c46a" />
      <circle cx="44.5" cy="35" r="1.6" fill="#e8c46a" />
    </svg>
  );
}