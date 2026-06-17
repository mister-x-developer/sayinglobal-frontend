import React from 'react';

interface AILogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * User AI Logo (Assistant)
 * Concept: Friendly, conversational, magical, organic loops.
 * Colors: Brand Primary (#1F7A52), Cyan (#00B89F), Warm Yellow (#F2B100)
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
        <linearGradient id="user-ai-grad1" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B89F" />
          <stop offset="100%" stopColor="#1F7A52" />
        </linearGradient>
        <linearGradient id="user-ai-grad2" x1="80" y1="20" x2="20" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F2B100" />
          <stop offset="100%" stopColor="#00B89F" stopOpacity="0.8" />
        </linearGradient>
        <filter id="user-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Soft Glow */}
      <circle cx="50" cy="50" r="42" fill="url(#user-ai-grad1)" opacity="0.1" filter="url(#user-glow)" />

      {/* Abstract Infinity / Chat Loop */}
      <path
        d="M 35 35 C 15 35, 15 65, 35 65 C 50 65, 50 35, 65 35 C 85 35, 85 65, 65 65"
        stroke="url(#user-ai-grad1)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M 65 65 C 55 65, 50 50, 45 45"
        stroke="url(#user-ai-grad2)"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Magic Sparkles */}
      <path d="M 75 20 L 78 12 L 81 20 L 89 23 L 81 26 L 78 34 L 75 26 L 67 23 Z" fill="#F2B100" />
      <path d="M 22 75 L 24 68 L 26 75 L 33 77 L 26 79 L 24 86 L 22 79 L 15 77 Z" fill="#00B89F" />
      
      {/* Central Node */}
      <circle cx="50" cy="50" r="6" fill="#FFFFFF" shadow="0 0 10px rgba(0,0,0,0.5)" />
      <circle cx="50" cy="50" r="6" fill="url(#user-ai-grad2)" opacity="0.5" />
    </svg>
  );
}

/**
 * Admin AI Logo (Moderator)
 * Concept: Authoritative, vigilant, sharp, precise, defensive.
 * Colors: Warning/Accent (#F2B100), Danger/Red, Dark Green/Teal
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
        <linearGradient id="admin-ai-grad1" x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F2B100" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="admin-ai-grad2" x1="10" y1="50" x2="90" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B89F" />
          <stop offset="100%" stopColor="#1F7A52" />
        </linearGradient>
        <filter id="admin-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagon Shield Background */}
      <path
        d="M 50 10 L 85 30 V 70 L 50 90 L 15 70 V 30 Z"
        fill="url(#admin-ai-grad1)"
        opacity="0.15"
      />
      <path
        d="M 50 16 L 79 33 V 67 L 50 84 L 21 67 V 33 Z"
        stroke="url(#admin-ai-grad1)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Inner Cyber Eye */}
      <path
        d="M 28 50 C 28 50, 40 35, 50 35 C 60 35, 72 50, 72 50 C 72 50, 60 65, 50 65 C 40 65, 28 50, 28 50 Z"
        fill="url(#admin-ai-grad2)"
        filter="url(#admin-glow)"
      />
      
      {/* Eye Core */}
      <circle cx="50" cy="50" r="8" fill="#111827" />
      <circle cx="52" cy="48" r="3" fill="#FFFFFF" />

      {/* Digital Circuit Lines */}
      <path d="M 50 16 V 28" stroke="#F2B100" strokeWidth="3" strokeLinecap="round" />
      <path d="M 50 72 V 84" stroke="#F2B100" strokeWidth="3" strokeLinecap="round" />
      <path d="M 15 50 H 22" stroke="#F2B100" strokeWidth="3" strokeLinecap="round" />
      <path d="M 78 50 H 85" stroke="#F2B100" strokeWidth="3" strokeLinecap="round" />
      
      {/* Outer Nodes */}
      <circle cx="50" cy="10" r="3" fill="#F2B100" />
      <circle cx="50" cy="90" r="3" fill="#F2B100" />
      <circle cx="15" cy="30" r="2" fill="#D97706" />
      <circle cx="85" cy="70" r="2" fill="#D97706" />
    </svg>
  );
}
