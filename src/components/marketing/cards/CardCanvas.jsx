import Wordmark from './Wordmark';

// Card layouts, rendered at 1080x1350 (4:5) and scaled down for preview.
//
// Built as HTML rather than generated, because these are a template with
// swappable words: the wordmark, spacing and icons come out identical every
// time, which is what makes a set of cards look like a set.

export const PALETTES = {
  forest: { bg: '#1F3B33', text: '#FAF7F0', accent: '#D98A80', tone: 'light', label: 'Forest' },
  cream: { bg: '#F5F1EA', text: '#1a1a1a', accent: '#D98A80', tone: 'dark', label: 'Cream' },
  blush: { bg: '#F2D9D2', text: '#1a1a1a', accent: '#1F3B33', tone: 'dark', label: 'Blush' },
  sage: { bg: '#CFE0D2', text: '#1a1a1a', accent: '#1F3B33', tone: 'dark', label: 'Sage' },
  ink: { bg: '#1a1a1a', text: '#FAF7F0', accent: '#D98A80', tone: 'light', label: 'Ink' },
};

export const LAYOUTS = {
  statement: 'Big statement',
  checklist: "You don't need…",
  photo: 'Photo with words',
  list: 'Built for',
};

const W = 1080;
const H = 1350;
const serif = "'Cormorant Garamond', Georgia, serif";
const sans = "'Inter', system-ui, sans-serif";
const script = "'Caveat', 'Segoe Script', cursive";

function Rule({ color }) {
  return <div style={{ width: 92, height: 5, background: color, borderRadius: 3, margin: '38px 0' }} />;
}

/** One card at full 1080x1350. The preview scales this with a CSS transform. */
export default function CardCanvas({ card, innerRef }) {
  const p = PALETTES[card.palette] || PALETTES.cream;
  const pad = 96;

  const base = {
    width: W, height: H, background: p.bg, color: p.text,
    padding: pad, boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
  };

  const headline = {
    fontFamily: serif, fontWeight: 600,
    fontSize: card.headlineSize || 92, lineHeight: 1.08, letterSpacing: '-0.015em',
    whiteSpace: 'pre-wrap', margin: 0,
  };

  const body = { fontFamily: sans, fontSize: 30, lineHeight: 1.55, opacity: 0.85, whiteSpace: 'pre-wrap', margin: 0 };

  return (
    <div ref={innerRef} style={base}>
      {card.layout === 'photo' && card.imageUrl && (
        <>
          <img
            src={card.imageUrl} alt="" crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.45) 100%)' }} />
        </>
      )}

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* STATEMENT: one thought, large, plenty of air. */}
        {card.layout === 'statement' && (
          <>
            <div style={{ flex: 1 }} />
            <h1 style={headline}>{card.headline}</h1>
            {card.body && <><Rule color={p.accent} /><p style={body}>{card.body}</p></>}
            <div style={{ flex: 1 }} />
          </>
        )}

        {/* CHECKLIST: names what is stopping the reader, then removes it. */}
        {card.layout === 'checklist' && (
          <>
            <div style={{ flex: 0.6 }} />
            <h1 style={{ ...headline, fontSize: card.headlineSize || 78 }}>{card.headline}</h1>
            <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 34 }}>
              {(card.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={p.text} strokeWidth="1.4">
                    <circle cx="12" cy="12" r="10" /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
                  </svg>
                  <span style={{ fontFamily: sans, fontSize: 36, textDecoration: 'line-through', textDecorationThickness: 2, opacity: 0.9 }}>{item}</span>
                </div>
              ))}
            </div>
            {card.body && (
              <p style={{ fontFamily: script, fontSize: 58, lineHeight: 1.25, marginTop: 64, whiteSpace: 'pre-wrap' }}>{card.body}</p>
            )}
            <div style={{ flex: 1 }} />
          </>
        )}

        {/* LIST: who this is for. */}
        {card.layout === 'list' && (
          <>
            <div style={{ flex: 0.5 }} />
            <h1 style={{ ...headline, fontSize: card.headlineSize || 76 }}>{card.headline}</h1>
            <div style={{ marginTop: 54, display: 'flex', flexDirection: 'column', gap: 32 }}>
              {(card.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 12, background: p.accent, flexShrink: 0 }} />
                  <span style={{ fontFamily: sans, fontSize: 36, lineHeight: 1.3 }}>{item}</span>
                </div>
              ))}
            </div>
            {card.body && <><Rule color={p.accent} /><p style={body}>{card.body}</p></>}
            <div style={{ flex: 1 }} />
          </>
        )}

        {/* PHOTO: the moment before. Words small, image doing the work. */}
        {card.layout === 'photo' && (
          <>
            <p style={{ fontFamily: sans, fontSize: 32, letterSpacing: '0.22em', lineHeight: 1.9, color: '#FAF7F0', whiteSpace: 'pre-wrap', margin: 0, textAlign: 'center' }}>
              {card.headline?.toUpperCase()}
            </p>
            <div style={{ flex: 1 }} />
            {card.body && (
              <p style={{ fontFamily: script, fontSize: 54, color: '#FAF7F0', textAlign: 'center', whiteSpace: 'pre-wrap', margin: 0 }}>{card.body}</p>
            )}
          </>
        )}

        <div style={{ marginTop: 'auto' }}>
          <Wordmark
            size={card.layout === 'photo' ? 46 : 52}
            tone={card.layout === 'photo' ? 'light' : p.tone}
            align={card.layout === 'photo' ? 'center' : 'left'}
          />
        </div>
      </div>
    </div>
  );
}

export const CARD_W = W;
export const CARD_H = H;
