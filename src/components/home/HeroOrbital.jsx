// Abstract luminous orbital artwork for the hero right side.
// Pure SVG (no external asset): nested thin curved light trails sweeping in
// from the right edge, glowing toward the rose/ember end. Theme-aware:
// the trail stop opacities and the glow/core layer opacities are driven by
// CSS variables (--orb-*) defined in src/index.css, so the artwork reads
// correctly on both the dark indigo (dark mode) and light cream (light
// mode) hero backgrounds. Contains no text, no logo, no icon.
export default function HeroOrbital() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-full opacity-50 sm:opacity-70 lg:opacity-100 lg:w-[52%]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMaxYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="orbTrail" x1="1000" y1="40" x2="340" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6B4A8A" />
            <stop offset="0.40" stopColor="#A95394" />
            <stop offset="0.68" stopColor="#D1475E" />
            <stop offset="1" stopColor="#FF7860" />
          </linearGradient>

          <radialGradient id="orbCore" cx="760" cy="398" r="200" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF7860" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#D1475E" stopOpacity="0.25" />
            <stop offset="1" stopColor="#8A4266" stopOpacity="0" />
          </radialGradient>

          <filter id="orbBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* diffused ember halo behind the brightest curves */}
        <ellipse className="orb-core" cx="760" cy="398" rx="210" ry="128" fill="url(#orbCore)" transform="rotate(-13 760 398)" />

        {/* glow layer — blurred wide strokes for the soft luminous haze */}
        <g className="orb-glow" stroke="url(#orbTrail)" fill="none" filter="url(#orbBlur)">
          <ellipse cx="1010" cy="340" rx="660" ry="295" transform="rotate(-13 1010 340)" strokeWidth="4" />
          <ellipse cx="1010" cy="340" rx="560" ry="248" transform="rotate(-13 1010 340)" strokeWidth="3.4" />
          <ellipse cx="1010" cy="340" rx="470" ry="200" transform="rotate(-13 1010 340)" strokeWidth="3" />
          <ellipse cx="1010" cy="340" rx="380" ry="154" transform="rotate(-13 1010 340)" strokeWidth="2.8" />
          <ellipse cx="1010" cy="340" rx="298" ry="110" transform="rotate(-13 1010 340)" strokeWidth="2.6" />
        </g>

        {/* crisp trails — thin sharp light lines, brighter toward the inner sweep */}
        <g stroke="url(#orbTrail)" fill="none">
          <ellipse cx="1010" cy="340" rx="660" ry="295" transform="rotate(-13 1010 340)" strokeWidth="1.1" opacity="0.40" />
          <ellipse cx="1010" cy="340" rx="560" ry="248" transform="rotate(-13 1010 340)" strokeWidth="1.1" opacity="0.55" />
          <ellipse cx="1010" cy="340" rx="470" ry="200" transform="rotate(-13 1010 340)" strokeWidth="1.15" opacity="0.75" />
          <ellipse cx="1010" cy="340" rx="380" ry="154" transform="rotate(-13 1010 340)" strokeWidth="1.25" opacity="0.92" />
          <ellipse cx="1010" cy="340" rx="298" ry="110" transform="rotate(-13 1010 340)" strokeWidth="1.5" opacity="1" />
        </g>
      </svg>
    </div>
  );
}