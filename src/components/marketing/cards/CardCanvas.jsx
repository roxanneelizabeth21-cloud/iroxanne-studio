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
  feature: 'Full ad (photo + benefits)',
};

const W = 1080;
const H = 1350;
const serif = "'Cormorant Garamond', Georgia, serif";
const sans = "'Inter', system-ui, sans-serif";
const script = "'Caveat', 'Segoe Script', cursive";

function Rule({ color }) {
  return <div style={{ width: 92, height: 5, background: color, borderRadius: 3, margin: '38px 0' }} />;
}

/** Bold anything wrapped in **asterisks**, so a supporting line can emphasise. */
function RichText({ text, style }) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);
  return (
    <p style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
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

        {/* FEATURE: the full advert. Logo lockup, two-tone headline, a short
            paragraph, a row of benefits, a photo panel and a footer call to
            action. The only part that cannot be drawn here is the photograph. */}
        {card.layout === 'feature' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              {/* Left: the words */}
              <div style={{ width: card.imageUrl ? '56%' : '100%', padding: '64px 0 40px 64px', display: 'flex', flexDirection: 'column' }}>
                <Wordmark size={46} tone={p.tone} align="left" />
                <div style={{ fontFamily: sans, fontSize: 17, letterSpacing: '0.16em', marginTop: 12, opacity: 0.65 }}>
                  {(card.brandTagline || 'CUSTOM APPS | WEBSITES').toUpperCase()}
                </div>

                <div style={{ marginTop: 52 }}>
                  <h1 style={{ fontFamily: sans, fontWeight: 800, fontSize: card.headlineSize || 62, lineHeight: 1.08, letterSpacing: '-0.02em', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {card.headline}
                  </h1>
                  {card.headlineAccent && (
                    <div style={{ display: 'inline-block', marginTop: 10 }}>
                      <div style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 600, fontSize: (card.headlineSize || 62) * 1.06, lineHeight: 1.1, color: p.accent, whiteSpace: 'pre-wrap' }}>
                        {card.headlineAccent}
                      </div>
                      <div style={{ height: 4, background: p.accent, opacity: 0.55, borderRadius: 3, marginTop: 6 }} />
                    </div>
                  )}
                </div>

                {card.body && (
                  <RichText text={card.body} style={{ fontFamily: sans, fontSize: 27, lineHeight: 1.5, marginTop: 34, opacity: 0.9, whiteSpace: 'pre-wrap' }} />
                )}

                <div style={{ flex: 1 }} />

                {(card.benefits || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 0, marginTop: 24 }}>
                    {card.benefits.map((b, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i ? `1px solid ${p.text}22` : 'none', padding: '0 10px' }}>
                        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={p.text} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
                          {i === 0 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9.5 12l1.8 1.8 3.4-3.6" /></>}
                          {i === 1 && <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M17 11l2 2 4-4" /></>}
                          {i === 2 && <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 4v4h-4" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 20v-4h4" /></>}
                          {i > 2 && <circle cx="12" cy="12" r="9" />}
                        </svg>
                        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 19, letterSpacing: '0.06em', lineHeight: 1.25, marginTop: 12, whiteSpace: 'pre-wrap' }}>
                          {String(b).toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: the photograph */}
              {card.imageUrl && (
                <div style={{ width: '44%', position: 'relative' }}>
                  <img src={card.imageUrl} alt="" crossOrigin="anonymous"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* Footer: tagline strip, then the call to action bar. */}
            <div style={{ background: p.bg, padding: '22px 64px', textAlign: 'center', fontFamily: sans, fontSize: 20, letterSpacing: '0.14em', opacity: 0.9 }}>
              {(card.footerTagline || 'A place to begin.').toUpperCase()}
            </div>
            <div style={{ background: p.tone === 'light' ? '#0f241f' : '#1F3B33', color: '#FAF7F0', padding: '30px 64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
              <span style={{ fontFamily: sans, fontSize: 24, letterSpacing: '0.08em' }}>
                {(card.ctaUrl || 'IROXANNESTUDIO.COM').toUpperCase()}
              </span>
              <span style={{ fontFamily: script, fontSize: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
                {card.ctaText || 'Let’s start the conversation.'}
                <span style={{ fontFamily: sans, fontSize: 32 }}>→</span>
              </span>
            </div>
          </div>
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
