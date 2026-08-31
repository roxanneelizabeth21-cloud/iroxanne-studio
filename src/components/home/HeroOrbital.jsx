// Abstract luminous orbital artwork for the hero right side.
// Pure SVG (no external asset): nested thin curved light trails sweeping in
// from the right edge, glowing toward the rose/ember end. Contains no text,
// no logo, no icon. Sits behind the hero content (z-auto under z-10 content).
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
          {/* Trail gradient: faint plum at the right origin -> mauve -> dusty rose -> warm ember */}
          <linearGradient id="orbTrail" x1="1000" y1="40" x2="340" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5B4A8C" stopOpacity="0" />
            <stop offset="0.12" stopColor="#6B4A8A" stopOpacity="0.30" />
            <stop offset="0.40" stopColor="#A95394" stopOpacity="0.65" />
            <stop offset="0.68" stopColor="#D1475E" stopOpacity="0.90" />
            <stop offset="1" stopColor="#FF7860" stopOpacity="1" />
          </linearGradient>

          {/* Soft diffused glow at the brightest part of the sweep */}
          <radialGradient id="orbCore" cx="760" cy="398" r="200" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF7860" stopOpacity="0.50" />
            <stop offset="0.5" stopColor="#D1475E" stopOpacity="0.22" />
            <stop offset="1" stopColor="#8A4266" stopOpacity="0" />
          </radialGradient>

          <filter id="orbBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* diffused ember halo behind the brightest curves */}
        <ellipse cx="760" cy="398" rx="210" ry="128" fill="url(#orbCore)" transform="rotate(-13 760 398)" />

        {/* glow layer — blurred wide strokes for the soft luminous haze */}
        <g stroke="url(#orbTrail)" fill="none" filter="url(#orbBlur)" opacity="0.85">
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