import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, ArrowUpRight, Calendar } from 'lucide-react';
import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';

export default function CaseStudy() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const results = await base44.entities.PortfolioItem.filter({ slug });
        if (active) setItem(results[0] || null);
      } catch { if (active) setItem(null); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#2D2A4A]">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 md:px-8 pt-[130px] pb-20">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2D2A4A]/40 hover:text-[#B8942E] transition" style={{ fontFamily: "'Inter', sans-serif" }}>
          <ArrowLeft className="h-4 w-4" /> Back to work
        </Link>

        {loading ? (
          <div className="flex justify-center py-32"><div className="h-8 w-8 border-4 border-[#2D2A4A]/10 border-t-[#2D2A4A] rounded-full animate-spin" /></div>
        ) : !item ? (
          <div className="py-32 text-center">
            <h1 className="text-[28px] font-semibold text-[#2D2A4A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Project not found</h1>
            <p className="mt-2 text-[15px] text-[#2D2A4A]/45" style={{ fontFamily: "'Inter', sans-serif" }}>This case study isn't available yet.</p>
            <Link to="/" className="mt-6 inline-block text-[14px] font-medium text-[#B8942E] hover:underline" style={{ fontFamily: "'Inter', sans-serif" }}>View all work</Link>
          </div>
        ) : (
          <article className="mt-8">
            <div className="flex flex-wrap items-center gap-3 text-[12px]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {item.category && (
                <span className="rounded-full bg-[#2D2A4A]/6 px-3 py-1 font-medium text-[#2D2A4A]/70">{item.category}</span>
              )}
              {item.date_built && (
                <span className="inline-flex items-center gap-1 text-[#2D2A4A]/35"><Calendar className="h-3.5 w-3.5" />{new Date(item.date_built).getFullYear()}</span>
              )}
              {item.project_tier && (
                <span className="rounded-full bg-[#B8942E]/10 px-3 py-1 font-medium text-[#B8942E]">{item.project_tier} tier</span>
              )}
            </div>

            <h1 className="mt-5 text-[40px] md:text-[50px] font-semibold tracking-tight leading-[1.05]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{item.title}</h1>
            {item.tagline && <p className="mt-4 text-[17px] text-[#2D2A4A]/50 leading-relaxed max-w-xl" style={{ fontFamily: "'Inter', sans-serif" }}>{item.tagline}</p>}

            {item.cover_image_url && (
              <div className="mt-10 overflow-hidden rounded-2xl border border-[#2D2A4A]/6 shadow-sm">
                <img src={item.cover_image_url} alt={item.title} className="w-full object-cover" />
              </div>
            )}

            {item.client_shareable && item.client_name && (
              <p className="mt-6 text-[13px] text-[#2D2A4A]/40" style={{ fontFamily: "'Inter', sans-serif" }}>
                Built for <span className="font-semibold text-[#2D2A4A]">{item.client_name}</span>
              </p>
            )}

            {item.saas_replacement_value && (
              <div className="mt-8 rounded-2xl bg-[#2D2A4A] p-6 md:p-8">
                <p className="text-[12px] font-medium text-[#C9A84C] tracking-wide mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>What this replaces</p>
                <p className="text-[15px] text-white/80 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{item.saas_replacement_value}</p>
              </div>
            )}

            {item.description && (
              <div className="mt-8 space-y-4 text-[15.5px] leading-[1.75] text-[#2D2A4A]/65" style={{ fontFamily: "'Inter', sans-serif" }}>
                {item.description.split('\n').map((p, i) => (p.trim() ? <p key={i}>{p}</p> : null))}
              </div>
            )}

            {item.marketing_features && (
              <div className="mt-10">
                <h2 className="text-[22px] font-semibold text-[#2D2A4A] mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>What's inside</h2>
                <div className="rounded-2xl border border-[#2D2A4A]/6 bg-white p-6 md:p-8 text-[14px] leading-[1.8] text-[#2D2A4A]/60 whitespace-pre-wrap" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {item.marketing_features}
                </div>
              </div>
            )}

            {item.tech_used?.length > 0 && (
              <div className="mt-10">
                <h2 className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Built with</h2>
                <div className="flex flex-wrap gap-2">
                  {item.tech_used.map((tech) => (
                    <span key={tech} className="rounded-full border border-[#2D2A4A]/8 bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#2D2A4A]/60" style={{ fontFamily: "'Inter', sans-serif" }}>{tech}</span>
                  ))}
                </div>
              </div>
            )}

            {item.screenshots?.length > 0 && (
              <div className="mt-10">
                <h2 className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Screenshots</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {item.screenshots.map((src, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-[#2D2A4A]/6 shadow-sm">
                      <img src={src} alt={`${item.title} screenshot ${i + 1}`} className="w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.video_url && (
              <div className="mt-10">
                <h2 className="text-[13px] font-medium text-[#B8942E] tracking-wide mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Demo</h2>
                <div className="aspect-video overflow-hidden rounded-xl border border-[#2D2A4A]/6 shadow-sm">
                  {item.video_url.includes('youtube') || item.video_url.includes('youtu.be') ? (
                    <iframe src={item.video_url.replace('watch?v=', 'embed/')} className="h-full w-full" title={`${item.title} demo`} allowFullScreen />
                  ) : (
                    <video src={item.video_url} controls className="h-full w-full" />
                  )}
                </div>
              </div>
            )}

            {item.project_url && (
              <a href={item.project_url} target="_blank" rel="noreferrer"
                className="mt-10 inline-flex items-center gap-2 h-12 px-7 rounded-full bg-[#2D2A4A] text-white text-[14px] font-semibold transition hover:bg-[#3D3A5A] shadow-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                Visit live project <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
