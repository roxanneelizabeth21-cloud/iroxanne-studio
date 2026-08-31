import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import PlatformLogo, { hasPlatformLogo } from './PlatformLogo';

export default function PlatformButton({ platform, index = 0, theme, label, variant = 'ghost', className = '' }) {
  const { name, Icon, url, platformType } = platform;
  const text = label || name;
  const filled = variant === 'filled';
  const surfaceColor = filled ? theme.teal : theme.cardBg;
  const borderColor = filled ? theme.teal : theme.border;
  const textColor = filled ? theme.tealText : theme.text;
  const iconColor = filled ? theme.tealText : theme.accent;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      className={`group flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl border transition-all duration-300 hover:shadow-lg ${filled ? 'font-semibold hover:scale-[1.02]' : 'backdrop-blur-sm hover:scale-[1.03]'} ${className}`}
      style={{ borderColor, background: surfaceColor, color: textColor }}
    >
      <span
        className="shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{ color: iconColor }}
      >
        {hasPlatformLogo(platformType) ? (
          <PlatformLogo platformType={platformType} className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : Icon ? (
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : null}
      </span>
      <span className="flex-1 min-w-0 truncate text-sm sm:text-base font-medium" style={{ color: textColor }}>
        {text}
      </span>
      <ArrowUpRight
        className="shrink-0 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        style={{ color: iconColor }}
      />
    </motion.a>
  );
}