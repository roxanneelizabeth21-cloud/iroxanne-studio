import { NavLink, Link } from 'react-router-dom';
import {
  Home, FolderKanban, FileText, Receipt, CalendarDays, LayoutDashboard,
  MessageSquare, Image, Megaphone, Eye, Mail, ScrollText, ArrowLeft, Briefcase,
} from 'lucide-react';
import './admin-views.css';

const NAV = [
  { to: '/admin', label: 'Business Home', Icon: Home, end: true },
  { to: '/admin/projects', label: 'Client Journey', Icon: FolderKanban },
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

const GROUPS = [
  { title: 'Daily work', routes: ['/admin', '/admin/projects', '/admin/messages'] },
  { title: 'Client documents', routes: ['/admin/proposals', '/admin/contracts', '/admin/invoices'] },
  { title: 'Website & audience', routes: ['/admin/homepage', '/admin/portfolio', '/admin/testimonials', '/admin/pages', '/admin/banners', '/admin/promo-banners', '/admin/visitors', '/admin/subscribers'] },
  { title: 'Business setup', routes: ['/admin/call-availability', '/admin/email-templates', '/admin/legal'] },
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
      <nav aria-label="Business navigation">
        {GROUPS.map(group => <section key={group.title} className="irx-business-nav-group">
          <h2>{group.title}</h2>
          {group.routes.map(route => NAV.find(item => item.to === route)).map(({ to, label, Icon, end }) => (
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
        </section>)}
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