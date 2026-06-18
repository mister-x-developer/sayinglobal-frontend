import React from 'react';
import Image from 'next/image';

interface AILogoProps {
  size?: number;
  className?: string;
}

/**
 * User AI Logo (Assistant)
 */
export function UserAILogo({ size = 40, className = '' }: AILogoProps) {
  return (
    <div 
      className={`relative overflow-hidden shrink-0 rounded-full border border-border bg-bg-subtle shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/ai/user_ai_logo.png"
        alt="AI Assistant"
        fill
        className="object-cover"
        sizes={`${size}px`}
      />
    </div>
  );
}

/**
 * Admin AI Logo (Moderator)
 */
export function AdminAILogo({ size = 40, className = '' }: AILogoProps) {
  return (
    <div 
      className={`relative overflow-hidden shrink-0 rounded-xl border border-border bg-bg-subtle shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/ai/admin_ai_logo.png"
        alt="AI Moderator"
        fill
        className="object-cover"
        sizes={`${size}px`}
      />
    </div>
  );
}
