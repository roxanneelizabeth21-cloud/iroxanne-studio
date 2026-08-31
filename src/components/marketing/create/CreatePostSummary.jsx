import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatform } from '@/lib/socialPlatforms';
import { resolveMedia } from '@/lib/postValidation';

const TITLES = {
  scheduled: 'Scheduled',
  draft: 'Saved as a draft',
  published: 'Published',
};

// Confirms what actually happened, then offers only the next steps that apply.
export default function CreatePostSummary({ result, post, clips, songTitle, platformIds, onCreateAnother }) {
  const media = resolveMedia(post, clips);
  return (
    <div className="max-w-xl space-y-4" aria-live="polite">
      <p className="flex items-center gap-2 text-lg font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> {TITLES[result.kind] || 'Done'}
      </p>

      <div className="glass rounded-2xl p-4 flex gap-3">
        {media ? (
          media.type === 'video'
            ? <video src={media.url} muted playsInline preload="metadata" className="h-20 w-20 rounded-lg object-cover bg-black shrink-0" />
            : <img src={media.url} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0" />
        ) : null}
        <div className="min-w-0 text-sm space-y-1">
          <p className="font-medium truncate">{songTitle || 'Roxsan'}</p>
          <p className="text-muted-foreground">{platformIds.map((id) => getPlatform(id)?.label).filter(Boolean).join(' + ')}</p>
          <p className="text-muted-foreground">Status: {post.status}</p>
          {result.when && <p className="text-muted-foreground">Goes live {result.when}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(result.kind === 'scheduled' || result.kind === 'draft') && (
          <Button asChild variant="outline"><Link to="/marketing/calendar">View in Content Calendar</Link></Button>
        )}
        <Button type="button" onClick={onCreateAnother}>Create Another Post</Button>
        <Button asChild variant="ghost"><Link to="/marketing">Return to Marketing Hub</Link></Button>
      </div>
    </div>
  );
}