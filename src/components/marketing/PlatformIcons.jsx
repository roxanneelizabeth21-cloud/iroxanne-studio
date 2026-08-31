// Distinct brand glyphs for the four marketing platforms.
// The installed icon library's deprecated brand marks read almost identically at
// small sizes (Instagram and Facebook are both plain rounded squares), which is
// what made two platforms look like the same Facebook icon. These are explicit,
// visually distinct marks — one per platform, never shared.

const base = 'shrink-0';

export function InstagramGlyph({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`} {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookGlyph({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className}`} {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.45-4.94 8.45-9.94Z" />
    </svg>
  );
}

export function TikTokGlyph({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className}`} {...props}>
      <path d="M16.6 2h-2.92v13.4a2.44 2.44 0 1 1-2.44-2.44c.2 0 .4.02.58.07v-2.96a5.6 5.6 0 0 0-.58-.03 5.4 5.4 0 1 0 5.4 5.4V8.36a6.63 6.63 0 0 0 3.96 1.3V6.72a3.75 3.75 0 0 1-2.4-1.02A3.77 3.77 0 0 1 16.6 2Z" />
    </svg>
  );
}

export function YouTubeGlyph({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className}`} {...props}>
      <path d="M21.6 7.2a2.79 2.79 0 0 0-1.96-1.98C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.64.42A2.79 2.79 0 0 0 2.4 7.2C2 8.94 2 12 2 12s0 3.06.4 4.8a2.79 2.79 0 0 0 1.96 1.98C6.1 19.2 12 19.2 12 19.2s5.9 0 7.64-.42a2.79 2.79 0 0 0 1.96-1.98C22 15.06 22 12 22 12s0-3.06-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}