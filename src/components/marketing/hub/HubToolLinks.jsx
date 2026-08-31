import { Link } from 'react-router-dom';

// Everything else stays one tap away, without crowding the hub.
const LINKS = [
  { to: '/marketing/calendar', label: 'Calendar' },
  { to: '/marketing/library', label: 'All Posts' },
  { to: '/marketing/clips', label: 'Clips' },
  { to: '/marketing/templates', label: 'Templates' },
  { to: '/marketing/brand', label: 'Brand' },
  { to: '/admin/songs', label: 'Song Profiles' },
  { to: '/marketing/meta-ads', label: 'Meta Ads' },
  { to: '/marketing/carousel-ads', label: 'Carousel Ads' },
  { to: '/marketing/strategist', label: 'Strategist' },
];

export default function HubToolLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {LINKS.map((l) => (
        <Link key={l.to} to={l.to} className="text-xs text-muted-foreground hover:text-primary">
          {l.label}
        </Link>
      ))}
    </div>
  );
}