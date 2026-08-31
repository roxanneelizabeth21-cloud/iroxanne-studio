import { motion } from 'framer-motion';
import { FileText, Music, Download, Mail, Image, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SocialLinks from '@/components/SocialLinks';
import PageBanner from '@/components/PageBanner';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

export default function PressKit() {
  return (
    <div className="min-h-screen">
      <PageBanner pageKey="press" icon={FileText} badge="Electronic Press Kit" title="Press Kit" subtitle="Everything you need for media, press, and bookings." />

      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-8">
        {/* Bio */}
        <motion.div {...fade(0.1)} className="glass rounded-2xl p-8 md:p-10">
          <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" /> Artist Bio
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">RoxSan</strong> is a soulful country-pop artist blending cinematic production with raw emotional storytelling. With a voice that carries both warmth and edge, her music explores themes of love, resilience, motherhood, and reinvention.
            </p>
            <p>
              Her sound draws from country storytelling traditions, modern pop production, and atmospheric textures — creating something that feels both timeless and refreshingly current. Each release is a piece of a larger story, inviting listeners into moments that feel deeply personal yet universally relatable.
            </p>
          </div>
        </motion.div>

        {/* Streaming */}
        <motion.div {...fade(0.15)} className="glass rounded-2xl p-8 md:p-10">
          <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
            <Music className="h-5 w-5 text-primary" /> Streaming Links
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['Spotify', 'Apple Music', 'YouTube', 'TikTok', 'Amazon Music'].map((p) => (
              <a key={p} href="#" className="flex items-center gap-2 p-3 rounded-xl glass glass-hover text-sm">
                <ExternalLink className="h-3 w-3 text-primary" />
                {p}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Press Photos */}
        <motion.div {...fade(0.2)} className="glass rounded-2xl p-8 md:p-10">
          <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
            <Image className="h-5 w-5 text-primary" /> Press Photos
          </h2>
          <p className="text-muted-foreground mb-6">High-resolution promo images available for media use.</p>
          <Button variant="outline" className="gap-2 border-border/50">
            <Download className="h-4 w-4" /> Download Press Photos
          </Button>
        </motion.div>

        {/* Brand Assets */}
        <motion.div {...fade(0.25)} className="glass rounded-2xl p-8 md:p-10">
          <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" /> Brand Assets
          </h2>
          <p className="text-muted-foreground mb-6">Logos, brand guidelines, and visual assets for authorized use.</p>
          <Button variant="outline" className="gap-2 border-border/50">
            <Download className="h-4 w-4" /> Download Brand Kit
          </Button>
        </motion.div>

        {/* Contact */}
        <motion.div {...fade(0.3)} className="glass rounded-2xl p-8 md:p-10">
          <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" /> Press Contact
          </h2>
          <p className="text-muted-foreground mb-4">For all media inquiries, interviews, and press requests:</p>
          <p className="text-foreground font-medium mb-6">press@roxsan.com</p>
          <SocialLinks />
        </motion.div>
      </div>
    </div>
  );
}