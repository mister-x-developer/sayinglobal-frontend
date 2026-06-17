import React from 'react';

interface AILogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * User AI Logo (Assistant)
 * Concept: Elegant, organic, continuous, helpful.
 * Aesthetic: Clean geometry, refined curves, classic.
 */
export function UserAILogo({ size = 40, className = '', ...props }: AILogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="user-ai-primary" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1F7A52" />
          <stop offset="100%" stopColor="#104D34" />
        </linearGradient>
      </defs>

      {/* Outer subtle ring */}
      <circle cx="50" cy="50" r="46" fill="transparent" stroke="#1F7A52" strokeWidth="1" strokeOpacity="0.2" />
      
      {/* Abstract elegant knot/infinity */}
      <path
        d="M 30 50 C 30 30, 50 30, 50 50 C 50 70, 70 70, 70 50 C 70 30, 50 30, 50 50 C 50 70, 30 70, 30 50"
        stroke="url(#user-ai-primary)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Core Node */}
      <circle cx="50" cy="50" r="4" fill="#F2B100" />
    </svg>
  );
}

/**
 * Admin AI Logo (Moderator)
 * Concept: Authoritative, secure, classic shield, geometric precision.
 * Aesthetic: Rolls-Royce, premium, strong minimal lines.
 */
export function AdminAILogo({ size = 40, className = '', ...props }: AILogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="admin-ai-primary" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>

      {/* Classic Shield Silhouette */}
      <path
        d="M 50 12 L 80 25 V 50 C 80 75, 50 92, 50 92 C 50 92, 20 75, 20 50 V 25 L 50 12 Z"
        fill="transparent"
        stroke="url(#admin-ai-primary)"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M 50 24 L 70 33 V 50 C 70 68, 50 80, 50 80 C 50 80, 30 68, 30 50 V 33 L 50 24 Z"
        fill="url(#admin-ai-primary)"
        fillOpacity="0.1"
      />

      {/* Inner precise geometry (Core) */}
      <circle cx="50" cy="48" r="8" fill="url(#admin-ai-primary)" />
      
      {/* Top authoritative crown/star */}
      <path d="M 50 32 L 53 40 L 61 40 L 55 45 L 57 53 L 50 48 L 43 53 L 45 45 L 39 40 L 47 40 Z" fill="#F2B100" />
    </svg>
  );
}
