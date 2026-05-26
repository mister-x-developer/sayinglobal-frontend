/**
 * SAYIN.Global — canonical SVG brand logo component.
 *
 * SOURCE OF TRUTH: logo.html inline SVG.
 * PNG files (logo.png / sayinglobal_logo.png) MUST NOT be used.
 *
 * Usage:
 *   <BrandLogo />              — full wordmark (icon + text), auth-aware link
 *   <BrandLogo iconOnly />     — icon only (48×48)
 *   <BrandLogo size={32} />    — custom icon size
 *   <BrandLogo noLink />       — render without wrapping link
 */

'use client';

import type React from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store/auth';

export interface BrandLogoProps {
  /** Icon width / height in px. Default 48. */
  size?: number;
  /** Render only the icon, without the "SAYIN. Global" wordmark. */
  iconOnly?: boolean;
  className?: string;
  /** If true, render without a wrapping link (e.g. on the auth page itself). */
  noLink?: boolean;
}

function BrandLogoSvg({ size = 48, iconOnly = false, className = '' }: BrandLogoProps) {
  const textScale = size / 48;

  return (
    <div
      className={`inline-flex items-center gap-[10px] ${className}`}
      aria-label="SAYIN.Global"
      role="img"
    >
      {/* SVG icon — the exact path data from logo.html */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Arch / U-shape body — primary brand green */}
        <path
          d="M20 90 V45 C20 20, 80 20, 80 45 V90 H60 V50 C60 40, 40 40, 40 50 V90 H20 Z"
          fill="#1F7A52"
        />
        {/* Droplet — brand gold/amber */}
        <path
          d="M50 80 C 35 60, 38 45, 50 45 C 62 45, 65 60, 50 80 Z"
          fill="#F2B100"
        />
        {/* Crown / cap — brand teal/accent */}
        <path
          d="M38 18 L50 12 L62 18 V26 C62 34, 50 38, 50 38 C 50 38, 38 34, 38 26 Z"
          fill="#00B89F"
        />
      </svg>

      {/* Wordmark — hidden when iconOnly */}
      {!iconOnly && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1,
            transform: `scale(${textScale})`,
            transformOrigin: 'left center',
          }}
        >
          <span
            style={{
              fontFamily: "'Poppins', 'Inter', 'Arial', sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: '#1F7A52',
              letterSpacing: '-0.02em',
            }}
          >
            SAYIN
            <span style={{ color: '#F2B100' }}>.</span>
          </span>
          <span
            style={{
              fontFamily: "'Poppins', 'Inter', 'Arial', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.25em',
              color: '#00B89F',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Global
          </span>
        </div>
      )}
    </div>
  );
}

export function BrandLogo({ size = 48, iconOnly = false, className = '', noLink = false }: BrandLogoProps & { noLink?: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.user?.is_admin);

  if (noLink) {
    return <BrandLogoSvg size={size} iconOnly={iconOnly} className={className} />;
  }

  // Auth-aware routing:
  // - Authenticated admin → /admin
  // - Authenticated user → /dashboard
  // - Unauthenticated → /
  const href = isAuthenticated
    ? isAdmin
      ? '/admin'
      : '/dashboard'
    : '/';

  return (
    <Link href={href} aria-label="SAYIN.Global — go to home" className={`inline-flex ${className}`}>
      <BrandLogoSvg size={size} iconOnly={iconOnly} />
    </Link>
  );
}

/**
 * BrandLogoCompact — tight inline logo for navbars / small spaces.
 * Renders icon + wordmark at a reduced scale.
 */
export function BrandLogoCompact({ className = '' }: { className?: string }) {
  return <BrandLogo size={32} className={className} />;
}

/**
 * BrandIcon — standalone icon, no text. Use in favicons, avatars, etc.
 */
export function BrandIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return <BrandLogo size={size} iconOnly className={className} />;
}
