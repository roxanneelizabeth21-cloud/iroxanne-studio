import { NavLink, Link } from 'react-router-dom';
import {
  Home, FolderKanban, FileText, Receipt, CalendarDays, LayoutDashboard,
  MessageSquare, Image, Megaphone, Eye, Mail, ScrollText, ArrowLeft, Briefcase,
} from 'lucide-react';
import './admin-views.css';

const NAV = [
  { to: '/admin', label: 'Overview', Icon: Home, end: true },
  { to: '/admin/projects', label: 'Projects Pipeline', Icon: FolderKanban },
  { to: '/admin/proposals', label: 'Quotes & Proposals', Icon: FileText },
  { to: '/admin/contracts', label: 'Contracts', Icon: FileText },
  { to: '/admin/invoices', label: 'Invoices', Icon: Receipt },
  { to: '/admin/call-availability', label: 'Call Availability', Icon: CalendarDays },
  { to: '/admin/homepage', label: 'Homepage', Icon: LayoutDashboard },
  { to: '/admin/portfolio', label: 'Portfolio', Icon: LayoutDashboard },
  { to: '/admin/testimonials', label: 'Testimonials', Icon: MessageSquare },
  { to: '/admin/pages', label: 'Pages', Icon: LayoutDashboard },
  { to: '/admin/banners', label: 'Banners', Icon: Image },
  { to: '/admin/promo-banners', label: 'Promo Banners', Icon: Megaphone },
  { to: '/admin/visitors', label: 'Visitors', Icon: Eye },
  { to: '/admin/subscribers', label: 'Subscribers', Icon: Mail },
  { to: '/admin/messages', label: 'Messages', Icon: MessageSquare },
  { to: '/admin/email-templates', label: 'Email Templates', Icon: Mail },
  { to: '/admin/legal', label: 'Legal', Icon: ScrollText },
];

export default function BusinessSidebar({ onNavigate }) {
  return (
    <div className="irx-sidebar h-full flex flex-col">
      <div className="brand-header">
        <div className="brand-mark">
          <Briefcase className="h-5 w-5" />
        </div>
        <h1>iRoxanne</h1>
        <p>Business Manager</p>
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
        <span>CLIENT WORKFLOW</span>
        <p>"Inquire · Propose · Sign · Build · Invoice"</p>
      </div>
    </div>
  );
}