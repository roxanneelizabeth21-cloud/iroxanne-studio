import { motion } from 'framer-motion';

export default function ReleaseDescription({ paragraphs, promoLine, theme }) {
  return (
    <section className="relative px-4 py-14 sm:py-16">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${theme.accent}, transparent 70%)` }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
        className="relative max-w-2xl mx-auto text-center"
      >
        <div
          className="mx-auto mb-6 h-px w-16"
          style={{ background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)` }}
        />
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-base sm:text-lg leading-relaxed mb-5"
            style={{ color: i === 0 ? theme.text : theme.textMuted }}
          >
            {p}
          </p>
        ))}
        {promoLine && (
          <>
            <div
              className="mx-auto my-8 h-px w-16"
              style={{ background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)` }}
            />
            <p className="font-display text-xl sm:text-2xl italic leading-snug" style={{ color: theme.accent }}>
              {promoLine}
            </p>
          </>
        )}
      </motion.div>
    </section>
  );
}