// The iRoxanne Studio wordmark, as type rather than an image.
//
// An image model redraws this differently every time, which is why generated
// cards never look like a set. Here it is CSS, so it is identical on every card.
export default function Wordmark({ size = 28, tone = 'dark', align = 'center', sub = 'STUDIO' }) {
  const color = tone === 'light' ? '#FAF7F0' : '#1a1a1a';
  const accent = '#D98A80';
  return (
    <div style={{ textAlign: align, lineHeight: 1 }}>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: size, fontWeight: 600, color, letterSpacing: '-0.01em' }}>
        <span style={{ color: accent, fontStyle: 'italic' }}>i</span>Roxanne
      </div>
      {sub && (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: size * 0.3, letterSpacing: size * 0.13, color, marginTop: size * 0.12, marginLeft: size * 0.13 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
