import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { getPostMedia } from '@/lib/postMedia';
import { displayTime } from '@/lib/postValidation';
import { formatDate, STATUS_STYLES } from '@/lib/marketing';

function Thumb({ media }) {
  if (media?.url && media.type === 'video') {
    return <video src={media.url} muted playsInline preload="metadata" className="h-14 w-[31px] rounded object-cover bg-muted shrink-0" />;
  }
  if (media?.url) {
    return <img src={media.url} alt="" className="h-14 w-[31px] rounded object-cover bg-muted shrink-0" />;
  }
  return <div className="h-14 w-[31px] rounded bg-muted shrink-0" aria-hidden="true" />;
}

// Section 2: only the next few scheduled posts. The calendar stays on its page.
export default function HubUpcoming({ posts, clips, campaignName }) {
  const next = posts.slice(0, 5);

  if (!next.length) {
    return (
      <div className="rounded-2xl border-[0.5px] border-border bg-card/60 p-6 text-center">
        <p className="text-sm text-muted-foreground">Nothing scheduled yet. Plan a campaign or create a single post.</p>
        <Link to="/marketing/quick" className="text-sm text-primary hover:underline mt-2 inline-block">Quick Create</Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {next.map((p) => {
        const media = getPostMedia(p, clips);
        return (
          <Link
            key={p.id}
            to={`/marketing/calendar?post=${p.id}`}
            className="flex items-center gap-3 rounded-xl border-[0.5px] border-border bg-card/60 p-3 hover:border-primary/40 transition-colors"
          >
            <Thumb media={media} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {formatDate(p.scheduled_date)}{p.scheduled_time ? ` · ${displayTime(p.scheduled_time)}` : ''}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {p.platform} · {p.format}{campaignName(p) ? ` · ${campaignName(p)}` : ''}
              </p>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[p.status] || 'bg-muted'}`}>{p.status}</span>
          </Link>
        );
      })}
      <Link to="/marketing/calendar" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline pt-1">
        <CalendarDays className="h-4 w-4" /> View Content Calendar
      </Link>
    </div>
  );
}