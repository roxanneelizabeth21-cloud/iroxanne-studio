import { NavLink } from 'react-router-dom';
import { Home, Music, Film, Image, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/music', label: 'Music', Icon: Music },
  { to: '/videos', label: 'Videos', Icon: Film },
  { to: '/gallery', label: 'Gallery', Icon: Image },
  { to: '/about', label: 'About', Icon: User },
];

export default function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 safe-area-bottom no-select">
      <div className="flex items-stretch justify-around h-14">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <t.Icon className="h-5 w-5" />
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}