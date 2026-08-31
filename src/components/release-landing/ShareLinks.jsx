import { Facebook, Twitter, MessageCircle } from 'lucide-react';
import ReleaseShareButton from '@/components/release-landing/ReleaseShareButton';

export default function ShareLinks({ theme, title = 'ROXSAN', slug }) {
  // Share the server-rendered preview URL so that iMessage / text / social
  // previews read the release cover art from raw HTML instead of the global
  // brand image in index.html. Humans who open the link are JS-redirected to
  // the real landing page (/release/<slug>).
  const url = (slug && typeof window !== 'undefined')
    ? `${window.location.origin}/functions/releaseShareMeta?slug=${encodeURIComponent(slug)}`
    : (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = encodeURIComponent(`${title} — ROXSAN`);
  const encodedUrl = encodeURIComponent(url);

  const shares = [
    { name: 'Facebook', Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'X', Icon: Twitter, href: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}` },
    { name: 'WhatsApp', Icon: MessageCircle, href: `https://wa.me/?text=${shareText}%20${encodedUrl}` },
  ];

  return (
    <section className="relative px-4 pb-8 pt-2">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] mb-3" style={{ color: theme.accent }}>Share this release</p>
        <div className="flex flex-wrap justify-center items-center gap-2">
          {shares.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs sm:text-sm transition-all duration-300 hover:scale-[1.03]"
              style={{ borderColor: theme.border, background: theme.cardBg, color: theme.text }}
            >
              <s.Icon className="h-3.5 w-3.5 shrink-0" style={{ color: theme.accent }} />
              {s.name}
            </a>
          ))}
          <ReleaseShareButton slug={slug} title={title} theme={theme} />
        </div>
      </div>
    </section>
  );
}