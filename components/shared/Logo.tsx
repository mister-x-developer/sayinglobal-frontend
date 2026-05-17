/**
 * SAYIN GLOBAL Logo
 * Source of truth: /logo.html
 */

import Link from 'next/link';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string | null;
  className?: string;
}

const SIZES = {
  xs: { svg: 28, text: 16, sub: 8, gap: 7 },
  sm: { svg: 36, text: 20, sub: 10, gap: 9 },
  md: { svg: 46, text: 25, sub: 12, gap: 11 },
  lg: { svg: 56, text: 30, sub: 13, gap: 12 },
  xl: { svg: 72, text: 38, sub: 15, gap: 14 },
};

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      role="img"
      className="flex-shrink-0"
    >
      <path
        d="M20 90 V45 C20 20, 80 20, 80 45 V90 H60 V50 C60 40, 40 40, 40 50 V90 H20 Z"
        fill="#1F7A52"
      />
      <path
        d="M50 80 C 35 60, 38 45, 50 45 C 62 45, 65 60, 50 80 Z"
        fill="#F2B100"
      />
      <path
        d="M38 18 L50 12 L62 18 V26 C62 34, 50 38, 50 38 C 50 38, 38 34, 38 26 Z"
        fill="#00B89F"
      />
    </svg>
  );
}

export function Logo({
  size = 'md',
  showText = true,
  href = '/',
  className = '',
}: LogoProps) {
  const s = SIZES[size];

  const inner = (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: `${s.gap}px` }}
    >
      <LogoMark size={s.svg} />
      {showText && (
        <span className="flex flex-col leading-none" aria-label="SAYIN GLOBAL">
          <span
            className="font-display font-extrabold text-brand-primary"
            style={{ fontSize: `${s.text}px`, letterSpacing: '-0.01em' }}
          >
            SAYIN<span className="text-brand-secondary">.</span>
          </span>
          <span
            className="font-display font-bold uppercase tracking-[0.25em] text-brand-accent"
            style={{ fontSize: `${s.sub}px`, marginTop: '4px' }}
          >
            Global
          </span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}

export { LogoMark };
