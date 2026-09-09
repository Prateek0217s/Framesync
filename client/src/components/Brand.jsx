import React from 'react';

// Brand mark — the Silver Star logo (public/logo.svg), shown without the
// wordmark (retired with the 2026 rebrand). The asset is dark-on-transparent,
// so index.css inverts it on the Dark Brut theme via .brand-logo.
export default function Brand({ size = 'md', className = '' }) {
  // Height-locked sizing so any aspect-ratio logo renders correctly.
  const h = size === 'lg' ? 40 : size === 'sm' ? 24 : 30;

  return (
    <img
      src="/logo.svg"
      alt="Silver Star"
      height={h}
      className={`brand-logo shrink-0 object-contain ${className}`}
      style={{ height: h, width: 'auto' }}
    />
  );
}
