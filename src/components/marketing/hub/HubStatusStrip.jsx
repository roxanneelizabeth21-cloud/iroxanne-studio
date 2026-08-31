import { Link } from 'react-router-dom';
import { CalendarDays, Library } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// One quiet line of status above the task grid — never a dashboard.
export default function HubStatusStrip({ dueToday, nextPost, nextTitle }) {
  const when = nextPost?.scheduled_date
    ? `${format(parseISO(nextPost.scheduled_date), 'EEEE')}${nextPost.scheduled_time ? ` ${nextPost.scheduled_time}` : ''}`
    : '';
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>{dueToday === 0 ? 'Nothing due today' : `${dueToday} post${dueToday === 1 ? '' : 's'} due today`}</span>
      {nextPost && (
        <>
          <span aria-hidden="true">·</span>
          <span>Next: {when}{nextTitle ? `, ${nextTitle}` : ''}</span>
        </>
      )}
      <span aria-hidden="true">·</span>
      <Link to="/marketing/calendar" className="inline-flex items-center gap-1 text-primary hover:underline">
        <CalendarDays className="h-3.5 w-3.5" /> Open Calendar
      </Link>
      <span aria-hidden="true">·</span>
      <Link to="/marketing/library" className="inline-flex items-center gap-1 text-primary hover:underline">
        <Library className="h-3.5 w-3.5" /> All Posts
      </Link>
    </div>
  );
}