import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import PlatformButton from './PlatformButton';

export default function ReleaseSmartLink({ theme, coverImage, artistName, title, subtitle, platforms = [], isLoading }) {
  const navigate = useNavigate();
  return (
    <>
      <button
        onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}
        className="fixed left-4 top-[calc(var(--safe-top)+1rem)] z-50 w-10 h-10 rounded-full glass flex items-center justify-center text-foreground hover:bg-secondary/50 transition-colors no-select"
        aria-label="Go back"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <section className="relative px-4 pt-8 pb-6 sm:pt-10 sm:pb-8 overflow-hidden">
      <div className="absolute inset-0" style={{ background: theme.heroBg }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

      <div className="relative z-10 max-w-[900px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto mb-4 w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-2xl overflow-hidden"
          style={{ boxShadow: `0 0 50px ${theme.glow}, 0 16px 50px rgba(0,0,0,0.65)` }}
        >
          {coverImage ? (
            <img src={coverImage} alt={`${title} — cover art`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: theme.coverFallback }}>
              <span className="font-display text-5xl font-bold" style={{ color: theme.text }}>R</span>
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-xs sm:text-sm uppercase tracking-[0.3em] mb-1"
          style={{ color: theme.accent }}
        >
          {artistName}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
          style={{ color: theme.text, textShadow: '0 2px 24px rgba(0,0,0,0.7)' }}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto max-w-lg mt-2 text-sm sm:text-base"
            style={{ color: theme.textMuted }}
          >
            {subtitle}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-5 sm:mt-6"
        >
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: `${theme.accent}33`, borderTopColor: theme.accent }} />
            </div>
          ) : platforms.length === 0 ? (
            <p className="py-6 text-sm" style={{ color: theme.textMuted }}>
              Listening links coming soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {platforms.map((p, i) => (
                <PlatformButton key={p.name} platform={p} index={i} theme={theme} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
    </>
  );
}