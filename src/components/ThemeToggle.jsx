import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('roxy-theme');
    let dark;
    if (saved === 'dark' || saved === 'light') {
      dark = saved === 'dark';
    } else {
      dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('roxy-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="rounded-full w-9 h-9">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}