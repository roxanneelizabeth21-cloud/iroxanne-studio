import { CAPTION_COLORS, CAPTION_FONTS } from '@/lib/captionImage';

const SIZE_CLASS = { tiny: 'text-[10px]', xsmall: 'text-xs', small: 'text-sm', medium: 'text-lg', large: 'text-2xl' };
const POSITION_CLASS = { top: 'items-start', center: 'items-center', bottom: 'items-end' };

// Live on-screen preview of the caption, matching how it gets drawn into the file.
export default function CaptionPreview({ asset, style }) {
  const scrimClass = style.color === 'black'
    ? 'bg-gradient-to-t from-white/80 via-white/60 to-transparent'
    : 'bg-gradient-to-t from-black/80 via-black/60 to-transparent';

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      {asset.kind === 'video' ? (
        <video src={asset.url} controls playsInline preload="metadata" className="w-full max-h-[46vh] object-contain" />
      ) : (
        <img src={asset.url} alt={asset.title} className="w-full max-h-[46vh] object-contain" />
      )}
      {style.text.trim() && (
        <div className={`pointer-events-none absolute inset-0 flex justify-center ${POSITION_CLASS[style.position]}`}>
          <div className={`relative w-full px-5 py-4 ${style.scrim ? scrimClass : ''}`}>
            <p
              className={`text-center leading-tight whitespace-pre-wrap ${SIZE_CLASS[style.size]}`}
              style={{
                color: CAPTION_COLORS[style.color],
                fontFamily: (CAPTION_FONTS[style.font] || CAPTION_FONTS.inter).stack,
                fontWeight: (CAPTION_FONTS[style.font] || CAPTION_FONTS.inter).weight,
              }}
            >
              {style.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}