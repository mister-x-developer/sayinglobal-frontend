import React from 'react';

interface AILogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * User AI Logo (Assistant)
 * Classic minimalist agriculture + AI motif
 */
export function UserAILogo({ size = 40, className = '', ...props }: AILogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {/* Minimalist leaf/sprout merging with a node/spark */}
      <path d="M12 22C12 22 4 16 4 10C4 6 7 3 10 3C11.5 3 12 4 12 4C12 4 12.5 3 14 3C17 3 20 6 20 10C20 16 12 22 12 22Z" />
      <path d="M12 22V12" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" />
      <path d="M12 2V4" />
      <path d="M6 8L7.5 9" />
      <path d="M18 8L16.5 9" />
    </svg>
  );
}

/**
 * Admin AI Logo (Moderator)
 * Classic minimalist shield + agriculture motif
 */
export function AdminAILogo({ size = 40, className = '', ...props }: AILogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {/* Minimalist shield with an eye and subtle agriculture references */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      <path d="M7 11s2-3 5-3 5 3 5 3-2 3-5 3-5-3-5-3z" />
    </svg>
  );
}
