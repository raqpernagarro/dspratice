'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ds';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('dsn-theme', next); } catch { /* storage unavailable */ }
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      showLabel={false}
      showLeadingIcon
      leadingIcon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
    />
  );
}
