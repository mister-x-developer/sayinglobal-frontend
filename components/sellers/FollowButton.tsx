'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Check, UserPlus } from 'lucide-react';
import { useFollowStore } from '@/lib/store/follow';
import { cn } from '@/lib/utils/cn';

interface FollowButtonProps {
  sellerId: number;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary';
  className?: string;
  disabled?: boolean;
  initialIsFollowing?: boolean;
}

export function FollowButton({
  sellerId,
  size = 'md',
  variant = 'primary',
  className,
  disabled,
  initialIsFollowing,
}: FollowButtonProps) {
  const t = useTranslations();
  const { isFollowing, toggle, syncLocalState } = useFollowStore();
  
  useEffect(() => {
    if (typeof initialIsFollowing === 'boolean') {
      syncLocalState(sellerId, initialIsFollowing);
    }
  }, [sellerId, initialIsFollowing, syncLocalState]);

  const following = isFollowing(sellerId);
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let isAuth = false;
    try {
      const authRaw = localStorage.getItem('sayin-auth-store');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        isAuth = !!(parsed?.state?.isAuthenticated || parsed?.isAuthenticated);
      }
    } catch {}

    if (!isAuth) {
      if (typeof window !== 'undefined') {
        window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
      return;
    }

    if (busy || disabled) return;
    setBusy(true);
    try {
      await toggle(sellerId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled || busy}
      aria-pressed={following}
      className={cn(
        'btn',
        size === 'sm' ? 'btn-sm' : '',
        following ? 'btn-secondary' : variant === 'primary' ? 'btn-primary' : 'btn-secondary',
        className
      )}
    >
      {following ? (
        <>
          <Check className="h-4 w-4" strokeWidth={2.25} />
          {t('sellers.following')}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" strokeWidth={2.25} />
          {t('sellers.follow')}
        </>
      )}
    </button>
  );
}
