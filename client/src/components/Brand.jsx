import React from 'react';

// FrameSync brand mark + wordmark.
export default function Brand({ size = 'md', showText = true, className = '' }) {
  const dim = size === 'lg' ? 40 : size === 'sm' ? 24 : 30;
  const text =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="fsg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A78BFA" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="14"
          fill="#0B0B12"
          stroke="url(#fsg)"
          strokeWidth="2.5"
        />
        <rect
          x="16"
          y="18"
          width="32"
          height="28"
          rx="4"
          fill="none"
          stroke="url(#fsg)"
          strokeWidth="3"
        />
        <path d="M28 26l10 6-10 6z" fill="url(#fsg)" />
        <path
          d="M16 18v28M48 18v28"
          stroke="url(#fsg)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      {showText && (
        <span className={`font-extrabold tracking-tight text-white ${text}`}>
          Frame<span className="text-primary-soft">Sync</span>
        </span>
      )}
    </div>
  );
}
