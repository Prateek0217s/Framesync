import { useEffect, useState } from 'react';

// Tracks the html.light class (applied pre-paint by the inline script in
// index.html, flipped by ThemeToggle). Re-renders on 'fs-theme-change' so
// shell-level pieces that can't be styled via CSS — e.g. the WebGL shader
// backdrop in App.jsx — can follow the active theme.
export default function useTheme() {
  const [light, setLight] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('light')
  );

  useEffect(() => {
    const sync = () =>
      setLight(document.documentElement.classList.contains('light'));
    window.addEventListener('fs-theme-change', sync);
    return () => window.removeEventListener('fs-theme-change', sync);
  }, []);

  return light;
}
