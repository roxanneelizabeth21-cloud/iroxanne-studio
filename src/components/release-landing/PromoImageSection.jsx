import { motion } from 'framer-motion';

export default function PromoImageSection({ heading, image, caption, theme }) {
  return (
    <section className="relative px-4 py-20 sm:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-8" style={{ color: theme.text }}>{heading}</h2>
        {image && (
          <motion.img
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            src={image}
            alt={heading}
            className="mx-auto rounded-2xl max-w-full border"
            style={{ borderColor: theme.border, boxShadow: `0 0 60px ${theme.glow}, 0 20px 50px rgba(0,0,0,0.5)` }}
          />
        )}
        {caption && (
          <p className="mt-8 text-base sm:text-lg" style={{ color: theme.textMuted }}>{caption}</p>
        )}
      </div>
    </section>
  );
}