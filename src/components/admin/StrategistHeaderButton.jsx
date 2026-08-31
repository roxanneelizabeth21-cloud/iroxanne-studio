import { Link, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Quick access to the Social Strategist agent, shown on the right of every
// marketing page heading row.
export default function StrategistHeaderButton() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/marketing/strategist')) return null;
  return (
    <Button asChild variant="secondary" size="sm" className="gap-1.5 shrink-0">
      <Link to="/marketing/strategist">
        <Bot className="h-4 w-4" /> Strategist
      </Link>
    </Button>
  );
}