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
      {/* AI Spark */}
      <path d="M19 3l.5 2.5 2.5.5-2.5.5-.5 2.5-.5-2.5-2.5-.5 2.5-.5L19 3z" fill="currentColor" stroke="none" />
      {/* Minimalist Sheep / Wool */}
      <path d="M14 6c-1.5 0-2.8.8-3.5 2-.7-1.2-2-2-3.5-2-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5v2.5c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-2.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4z" />
      <path d="M7 14v4" />
      <path d="M13 14v4" />
      <circle cx="8" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none" />
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
      {/* Shield outline */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      {/* Minimalist Sheep Face inside shield */}
      <path d="M14 10.5a2.5 2.5 0 0 0-4 0" />
      <path d="M10 13a2 2 0 1 0 4 0" />
      <circle cx="10.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <path d="M8.5 9c-.5.5-1 1.5-.5 2.5" />
      <path d="M15.5 9c.5.5 1 1.5.5 2.5" />
    </svg>
  );
}
