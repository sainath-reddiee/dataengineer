import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getStoredTheme, setStoredTheme } from '@/hooks/useTheme';

const ThemeToggle = ({ className = '' }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const next = getStoredTheme();
    setTheme(next);
    applyTheme(next);
  }, []);

  const dark = theme === 'dark';

  return (
    <button
      type="button"
      className={`inline-flex h-11 w-11 items-center justify-center rounded text-ink-muted transition-colors hover:bg-paper-300/60 hover:text-ink ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      title={dark ? 'Light mode' : 'Dark mode'}
      onClick={() => {
        const next = dark ? 'light' : 'dark';
        setTheme(next);
        setStoredTheme(next);
      }}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
