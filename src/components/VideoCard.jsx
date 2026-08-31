import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
  return match ? match[1] : null;
}

export default function VideoCard({ video, onClick }) {
  const videoId = getYouTubeId(video.youtube_url);
  const thumb = video.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => onClick?.(video)}
      className="group glass rounded-2xl overflow-hidden cursor-pointer glass-hover"
    >
      <div className="aspect-video relative overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Play className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow-blue">
            <Play className="h-6 w-6 text-white ml-0.5" />
          </div>
        </div>
        {video.type && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-black/60 text-white backdrop-blur-sm">
            {video.type.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{video.title}</h3>
        {video.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
        )}
      </div>
    </motion.div>
  );
}