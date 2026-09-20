import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Megaphone, Briefcase } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import NotificationBell from './NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import './admin-views.css';

export default function ViewSwitcher() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMarketing = location.pathname.startsWith('/marketing');

  return (
    <div className="view-switcher">
      <Link to="/" className="vs-brand">
        <BrandLogo height="h-9" />
      </Link>
      <div className="vs-tabs">
        <button
          className={isMarketing ? 'active' : ''}
          onClick={() => navigate('/marketing')}
          aria-pressed={isMarketing}
        >
          <Megaphone className="vs-tab-icon" />
          Marketing
        </button>
        <button
          className={!isMarketing ? 'active' : ''}
          onClick={() => navigate('/admin')}
          aria-pressed={!isMarketing}
        >
          <Briefcase className="vs-tab-icon" />
          Business
        </button>
      </div>
      <div className="vs-actions">
        <ThemeToggle />
        <NotificationBell />
        <Link to="/" className="vs-site-link">Back to site</Link>
      </div>
    </div>
  );
}