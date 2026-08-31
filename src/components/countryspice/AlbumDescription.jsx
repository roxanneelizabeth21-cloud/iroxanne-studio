import { motion } from 'framer-motion';

export default function AlbumDescription() {
  return (
    <section className="relative px-4 py-14 sm:py-16">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #e8703c, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
        className="relative max-w-2xl mx-auto text-center"
      >
        <div className="mx-auto mb-6 h-px w-16 bg-gradient-to-r from-transparent via-[#d4a04a] to-transparent" />

        <p className="text-base sm:text-lg leading-relaxed text-[#ede0cc]">
          Little Bit Country, Little Bit Spice brings together country soul, island warmth, and
          Roxsan's signature storytelling style. The sound is bold, smooth, and sunlit, blending
          heartfelt country energy with a little rhythm, a little attitude, and a whole lot of
          personality.
        </p>

        <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#d4c4a8]">
          This release is for listeners who love music with feeling, flavor, and a strong sense of
          identity.
        </p>

        <div className="mx-auto my-8 h-px w-16 bg-gradient-to-r from-transparent via-[#d4a04a] to-transparent" />

        <p className="font-display text-xl sm:text-2xl italic text-[#e8b85a] leading-snug">
          Little bit country. Little bit spice. Island vibes with country soul.
        </p>
      </motion.div>
    </section>
  );
}