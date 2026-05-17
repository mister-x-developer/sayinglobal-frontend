/**
 * Badge — small status indicator.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-full font-semibold transition-colors leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-bg-subtle text-fg-muted',
        primary: 'bg-brand-primary/10 text-brand-primary',
        secondary: 'bg-brand-accent/12 text-brand-accent',
        success: 'bg-success/12 text-success',
        warning: 'bg-warning/12 text-warning',
        error: 'bg-danger/12 text-danger',
        info: 'bg-info/12 text-info',
        outline: 'border border-border bg-transparent text-fg',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
