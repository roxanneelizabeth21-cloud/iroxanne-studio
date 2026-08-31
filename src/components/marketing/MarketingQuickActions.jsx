import { Link } from 'react-router-dom';
import {
  PenLine, Megaphone, CalendarDays, Image, LayoutTemplate, Clapperboard, UserCircle, Library, BarChart3,
} from 'lucide-react';

const PRIMARY = { to: '/marketing/quick', label: 'Create Post', Icon: PenLine };

const ACTIONS = [
  { to: '/marketing/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/marketing/campaigns', label: 'Campaigns', Icon: Megaphone },
  { to: '/marketing/media', label: 'Media', Icon: Image },
  { to: '/marketing/clips', label: 'Clips', Icon: Clapperboard },
  { to: '/marketing/templates', label: 'Templates', Icon: LayoutTemplate },
  { to: '/marketing/library', label: 'All Posts', Icon: Library },
  { to: '/marketing/performance', label: 'Performance', Icon: BarChart3 },
  { to: '/marketing/brand', label: 'Brand', Icon: UserCircle },
];

const itemClass =
  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm tracking-wide text-[#EFE7DA] hover:bg-white/5 transition-colors';

export default function MarketingQuickActions() {
  return (
    <nav
      aria-label="Marketing shortcuts"
      className="relative w-full overflow-hidden rounded-xl bg-[#12201F] pl-4 pr-3 py-3"
    >
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#C9A75E]" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Link to={PRIMARY.to} className={`${itemClass} sm:pr-5`}>
          <PRIMARY.Icon className="h-4 w-4 shrink-0 text-[#C9A75E]" />
          {PRIMARY.label}
        </Link>
        <span aria-hidden className="hidden sm:block w-px bg-[#22403C]" />
        <div className="grid flex-1 grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-4">
          {ACTIONS.map(({ to, label, Icon }) => (
            <Link key={to} to={to} className={itemClass}>
              <Icon className="h-4 w-4 shrink-0 text-[#C9A75E]" />
              <span className="leading-snug">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}