import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GalleryGrid({ images }) {
  const [selected, setSelected] = useState(null);

  const selectedIdx = selected ? images.findIndex((img) => img.id === selected.id) : -1;
  const prev = () => setSelected(images[Math.max(0, selectedIdx - 1)]);
  const next = () => setSelected(images[Math.min(images.length - 1, selectedIdx + 1)]);

  return (
    <>
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {images.map((img, i) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 4) * 0.05 }}
            className="group relative overflow-hidden rounded-xl cursor-pointer break-inside-avoid"
            onClick={() => setSelected(img)}
          >
            <img
              src={img.image_url}
              alt={img.title}
              loading="lazy"
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <p className="text-white text-xs font-medium truncate">{img.title}</p>
            </div>
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity glow-blue-sm">
              <ZoomIn className="h-3.5 w-3.5 text-white" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setSelected(null)}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 transition-colors"
              onClick={() => setSelected(null)}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev */}
            {selectedIdx > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 transition-colors"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Next */}
            {selectedIdx < images.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 transition-colors"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={selected.id}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="max-w-4xl max-h-[85vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selected.image_url}
                alt={selected.title}
                className="max-h-[80vh] max-w-full object-contain rounded-xl glow-blue"
              />
              <div className="mt-3 text-center">
                <p className="text-white font-medium">{selected.title}</p>
                {selected.category && (
                  <p className="text-white/50 text-sm capitalize">{selected.category.replace('_', ' ')}</p>
                )}
              </div>
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
              {selectedIdx + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}