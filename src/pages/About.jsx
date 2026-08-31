import { motion } from 'framer-motion';
import { Heart, Sparkles, Quote, Music } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageBanner from '@/components/PageBanner';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

const DEFAULT = {
  artist_story: "RoxSan is a soulful country-pop artist whose music lives in the space between heartache and hope. With a voice that carries both warmth and edge, she writes from a place of honest emotion — songs built from real-life moments, real feelings, and the kind of truth that doesn't flinch.",
  artist_story_2: "Growing up surrounded by storytelling and melody, RoxSan found her voice early — but it took living through love, loss, motherhood, and reinvention to truly find her sound. Her music blends cinematic production with country soul, creating something that feels both timeless and unmistakably modern.",
  artist_story_3: "Whether she's writing late at night after the house goes quiet or pulling from a melody that won't leave her alone, RoxSan's process is deeply personal. Every lyric is lived-in. Every note is intentional.",
  quote: "I write the songs I needed to hear when nobody was saying the right thing.",
  creative_inspiration_1: "RoxSan draws from the wells of country storytelling, pop production, and cinematic soundscapes. Her influences range from the vulnerability of Kacey Musgraves to the atmospheric textures of Lana Del Rey — always filtered through her own deeply personal lens.",
  creative_inspiration_2: "Her songwriting themes circle back to the things that matter most: identity, resilience, the messy beauty of being a mother, and the courage it takes to start over. Faith weaves through her work — not as a sermon, but as a quiet presence that holds the songs together.",
  life_motherhood_1: "Motherhood changed everything — the way she hears music, the way she writes, the weight of every word. RoxSan's journey as a mother isn't separate from her artistry; it's the fire that fuels it. The late nights, the soft moments, the fierce love — it all pours into the music.",
  life_motherhood_2: "She writes for the women who carry everything and still find a way to dream. For the ones who feel deeply and refuse to apologize for it. RoxSan's music is a mirror for anyone who has ever felt too much and decided that was their superpower.",
};

export default function About() {
  const { data: records = [] } = useQuery({
    queryKey: ['artist-bio'],
    queryFn: () => base44.entities.ArtistBio.list(),
  });
  const bio = { ...DEFAULT, ...(records[0] || {}) };

  return (
    <div className="min-h-screen">
      <PageBanner pageKey="about" icon={Heart} badge="The Story" title="About RoxSan" subtitle="The heart behind the music." />

      <div className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
         {/* Story */}
         <motion.section {...fade(0.1)} className="glass rounded-2xl p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" /> The Artist Story
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            {bio.artist_story && <p>{bio.artist_story}</p>}
            {bio.artist_story_2 && <p>{bio.artist_story_2}</p>}
            {bio.artist_story_3 && <p>{bio.artist_story_3}</p>}
          </div>
        </motion.section>

        {/* Quote */}
        <motion.section {...fade(0.15)} className="text-center py-8">
          <Quote className="h-8 w-8 text-primary/50 mx-auto mb-4" />
          <blockquote className="font-display text-xl sm:text-2xl font-medium italic text-foreground/90 max-w-2xl mx-auto leading-relaxed">
            "{bio.quote}"
          </blockquote>
          <p className="text-sm text-primary mt-4">— RoxSan</p>
        </motion.section>

        {/* Inspiration */}
        <motion.section {...fade(0.2)} className="glass rounded-2xl p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
            <Music className="h-5 w-5 text-primary" /> Creative Inspiration
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            {bio.creative_inspiration_1 && <p>{bio.creative_inspiration_1}</p>}
            {bio.creative_inspiration_2 && <p>{bio.creative_inspiration_2}</p>}
          </div>
        </motion.section>

        {/* Motherhood */}
        <motion.section {...fade(0.25)} className="glass rounded-2xl p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary" /> Life & Motherhood
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            {bio.life_motherhood_1 && <p>{bio.life_motherhood_1}</p>}
            {bio.life_motherhood_2 && <p>{bio.life_motherhood_2}</p>}
          </div>
        </motion.section>
      </div>
    </div>
  );
}