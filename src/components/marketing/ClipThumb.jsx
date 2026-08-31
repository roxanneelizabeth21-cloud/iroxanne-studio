import { Film, Download } from 'lucide-react';

const VIDEO_EXT = /\.(mp4|mov|m4v|webm|ogg|avi|mkv|wmv|flv)(\?|$)/i;
const PLAYABLE_EXT = /\.(mp4|mov|m4v|webm|ogg)(\?|$)/i;

export const isVideoFile = (url) => VIDEO_EXT.test(url || '');
export const isPlayableVideo = (url) => PLAYABLE_EXT.test(url || '');

// Preview tile for one clip. Videos the browser can play get a player;
// formats it cannot (like .avi) get a clear note plus a download link so the
// clip is never a blank square.
export default function ClipThumb({ file, title }) {
  if (!file) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Film className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (isVideoFile(file)) {
    if (isPlayableVideo(file)) {
      return <video src={file} className="w-full h-full object-cover" controls muted playsInline preload="metadata" />;
    }
    const ext = (file.match(VIDEO_EXT)?.[1] || 'this').toUpperCase();
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
        <Film className="h-6 w-6 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground leading-snug">
          {ext} files can't play in a browser. Download it, or upload an MP4 version.
        </p>
        <a
          href={file}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
        >
          <Download className="h-3 w-3" /> Download
        </a>
      </div>
    );
  }

  return <img src={file} alt={title} loading="lazy" className="w-full h-full object-cover" />;
}