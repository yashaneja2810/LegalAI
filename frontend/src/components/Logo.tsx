import React from 'react';

export const Logo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className + ' animate-logo-spin'}
    style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }}
  >
    <defs>
      <linearGradient id="bolt-blue" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60a5fa" />
        <stop offset="0.5" stopColor="#2563eb" />
        <stop offset="1" stopColor="#0ea5e9" />
      </linearGradient>
      <radialGradient id="bolt-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#bolt-glow)" />
    <path
      d="M28 8 L36 8 L32 28 H40 L24 56 L28 32 H20 L28 8 Z"
      fill="url(#bolt-blue)"
      stroke="#fff"
      strokeWidth="2"
      strokeLinejoin="round"
      style={{ filter: 'brightness(1.2)' }}
    />
  </svg>
);
