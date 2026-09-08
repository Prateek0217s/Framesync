import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Dark/light theme toggle (PDD Phase 8). The initial class is applied
// pre-paint by the inline script in index.html; this component flips it and
// persists the choice. Multiple mounted toggles stay in sync via the
// 'fs-theme-change' event.
const STORAGE_KEY = 'fs-theme';
const isLight = () => document.documentElement.classList.contains('light');

export default function ThemeToggle({ className = '' }) {
  const [light, setLight] = useState(isLight);

  useEffect(() => {
    const sync = () => setLight(isLight());
    window.addEventListener('fs-theme-change', sync);
    return () => window.removeEventListener('fs-theme-change', sync);
  }, []);

  const toggle = () => {
    const next = !light;
    document.documentElement.classList.toggle('light', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'light' : 'dark');
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
    window.dispatchEvent(new Event('fs-theme-change'));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={light ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-label="Toggle color theme"
      className={`fs-btn-ghost px-2.5 py-2 ${className}`}
    >
      {light ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
