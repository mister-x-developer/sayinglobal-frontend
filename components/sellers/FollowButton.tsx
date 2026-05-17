'use client';

import { useState } from 'react';
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
}

export function FollowButton({
  sellerId,
  size = 'md',
  variant = 'primary',
  className,
  disabled,
}: FollowButtonProps) {
  const t = useTranslations();
  const { isFollowing, toggle } = useFollowStore();
  const following = isFollowing(sellerId);
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
