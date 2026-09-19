import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, PenLine, Palette, Clapperboard, Megaphone, CalendarDays,
  Library, Image, BarChart3, LayoutTemplate, ToggleLeft, UserCircle, Bot,
  ArrowLeft,
} from 'lucide-react';
import './admin-views.css';

const NAV = [
  { to: '/marketing', label: 'Marketing Home', Icon: LayoutDashboard, end: true },
  { to: '/marketing/post', label: 'Create a Post', Icon: PenLine },
  { to: '/marketing/cards', label: 'Card Studio', Icon: Palette },
  { to: '/marketing/reel', label: 'Create a Reel', Icon: Clapperboard },
  { to: '/marketing/campaigns', label: 'Campaigns', Icon: Megaphone },
  { to: '/marketing/calendar', label: 'Content Calendar', Icon: CalendarDays },
  { to: '/marketing/library', label: 'All Posts', Icon: Library },
  { to: '/marketing/media', label: 'Media Library', Icon: Image },
  { to: '/marketing/canvas', label: 'Case Study Canvas', Icon: Palette },
  { to: '/marketing/carousel-ads', label: 'Carousel Ads', Icon: Megaphone },
  { to: '/marketing/meta-ads', label: 'Meta Ads', Icon: BarChart3 },
  { to: '/marketing/templates', label: 'Templates', Icon: LayoutTemplate },
  { to: '/marketing/clips', label: 'Clips', Icon: Clapperboard },
  { to: '/marketing/controls', label: 'Automation Controls', Icon: ToggleLeft },
  { to: '/marketing/performance', label: 'Performance', Icon: BarChart3 },
  { to: '/marketing/brand', label: 'Brand Profile', Icon: UserCircle },
  { to: '/marketing/strategist', label: 'Strategist', Icon: Bot },
];

export default function MarketingSidebar({ onNavigate }) {
  return (
    <div className="irx-sidebar h-full flex flex-col">
      <div className="brand-header">
        <div className="brand-mark">
          <Megaphone className="h-5 w-5" />
        </div>
        <h1>iRoxanne</h1>
        <p>Marketing Studio</p>
      </div>
      <nav className="flex-1">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon className="h-4 w-4 shrink-0" /> {label}
          </NavLink>
        ))}
      </nav>
      <Link to="/" onClick={onNavigate} className="sidebar-footer-link">
        <span>Back to site</span>
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="sidebar-motto">
        <span>YOUR BRAND</span>
        <p>"Create · Schedule · Post · Grow"</p>
      </div>
    </div>
  );
}