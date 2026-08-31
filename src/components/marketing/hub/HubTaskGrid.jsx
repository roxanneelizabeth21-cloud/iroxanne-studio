import { Link } from 'react-router-dom';
import { Image, FileText, Film, Megaphone, FolderOpen, TrendingUp } from 'lucide-react';

// The hub's only job: six clear entry points, nothing competing.
const TASKS = [
  { to: '/marketing/canvas', icon: Image, title: 'Case Study Canvas', desc: 'A colour-matched case-study card from your project screenshots' },
  { to: '/marketing/post', icon: FileText, title: 'Create a Post', desc: 'One post, guided end to end' },
  { to: '/marketing/reel', icon: Film, title: 'Create a Reel', desc: 'Plan a short video from your clips' },
  { to: '/marketing/campaigns', icon: Megaphone, title: 'Create a Campaign', desc: 'A full project campaign on the calendar' },
  { to: '/marketing/media', icon: FolderOpen, title: 'Media Library', desc: 'All your images and clips, by category' },
  { to: '/marketing/performance', icon: TrendingUp, title: 'Performance', desc: "How posts are doing, and what's ready to promote" },
];

export default function HubTaskGrid() {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {TASKS.map(({ to, icon: Icon, title, desc, soon }) => {
        const body = (
          <>
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            {soon && <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">Coming next</p>}
          </>
        );
        return soon ? (
          <div key={to} aria-disabled="true" className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-4 opacity-70">
            {body}
          </div>
        ) : (
          <Link key={to} to={to} className="rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/50">
            {body}
          </Link>
        );
      })}
    </div>
  );
}