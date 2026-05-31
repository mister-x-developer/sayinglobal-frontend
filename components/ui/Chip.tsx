/**
 * Chip — small pill-shaped status indicator.
 *
 * Canonical component following the same `cva` variant pattern as Button.
 * Wraps the existing `chip*` design-token utility classes defined in
 * `globals.css` (and safelisted in `tailwind.config.ts`) so every page uses a
 * single, consistent chip instead of ad-hoc inline markup.
 */

import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const chipVariants = cva('chip', {
  variants: {
    variant: {
      neutral: 'chip-neutral',
      success: 'chip-success',
      warning: 'chip-warning',
      danger: 'chip-danger',
      info: 'chip-info',
    },
    size: {
      sm: 'text-[11px] px-2 py-0.5',
      md: '',
      lg: 'text-sm px-3 py-1.5',
    },
  },
  defaultVariants: { variant: 'neutral', size: 'md' },
});

export interface ChipProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span ref={ref} className={cn(chipVariants({ variant, size }), className)} {...props} />
  )
);
Chip.displayName = 'Chip';

export { Chip, chipVariants };
