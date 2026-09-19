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
        <BrandLogo className="h-7 w-7" />
        <span>iRoxanne</span>
      </Link>
      <button
        className={isMarketing ? 'active' : ''}
        onClick={() => navigate('/marketing')}
      >
        <Megaphone className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
        Marketing
      </button>
      <button
        className={!isMarketing ? 'active' : ''}
        onClick={() => navigate('/admin')}
      >
        <Briefcase className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
        Business
      </button>
      <div className="vs-actions">
        <ThemeToggle />
        <NotificationBell />
      </div>
      <Link to="/" className="vs-site-link">Back to site</Link>
    </div>
  );
}