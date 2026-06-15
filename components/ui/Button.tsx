/**
 * Button — premium, polymorphic.
 * Works with any element (`as` prop) including Next.js `<Link>` (passed as JSX element).
 */

'use client';

import {
  ButtonHTMLAttributes,
  ElementType,
  forwardRef,
  ReactElement,
  cloneElement,
  Children,
  isValidElement,
} from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold whitespace-nowrap select-none',
    'transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-primary text-white',
          'hover:bg-brand-primary/95',
          'shadow-[0_4px_12px_rgb(var(--brand-primary)/0.25)] hover:shadow-[0_6px_16px_rgb(var(--brand-primary)/0.35)] hover:-translate-y-[1px]',
          'active:translate-y-[1px] active:shadow-[0_2px_8px_rgb(var(--brand-primary)/0.15)]',
        ].join(' '),
        secondary: 'bg-bg-elevated text-fg border border-border hover:bg-bg-subtle hover:-translate-y-[1px] shadow-sm active:translate-y-0',
        outline: 'border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary/5 active:bg-brand-primary/10',
        ghost: 'bg-transparent text-fg hover:bg-bg-subtle active:bg-bg-subtle/80',
        danger: 'bg-danger text-white hover:bg-danger/90 hover:-translate-y-[1px] shadow-[0_4px_12px_rgb(var(--danger)/0.25)] hover:shadow-[0_6px_16px_rgb(var(--danger)/0.35)]',
        success: 'bg-success text-white hover:bg-success/90 hover:-translate-y-[1px] shadow-[0_4px_12px_rgb(var(--success)/0.25)] hover:shadow-[0_6px_16px_rgb(var(--success)/0.35)]',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-xl',
        md: 'h-11 px-6 text-[15px] rounded-xl',
        lg: 'h-13 px-8 text-base rounded-2xl',
        xl: 'h-15 px-10 text-[17px] rounded-[20px]',
        icon: 'h-11 w-11 p-0 rounded-xl',
        'icon-sm': 'h-9 w-9 p-0 rounded-xl',
      },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  asChild?: boolean;
  as?: ElementType;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      loadingText,
      disabled,
      asChild,
      as,
      children,
      ...props
    },
    ref
  ) => {
    const finalClass = cn(buttonVariants({ variant, size, fullWidth }), className);

    // asChild: clone first child, applying classes
    if (asChild && isValidElement(children)) {
      const child = Children.only(children) as ReactElement;
      return cloneElement(child, {
        className: cn(child.props.className, finalClass),
        ...props,
      });
    }

    const content = isLoading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
        {loadingText ?? 'Yuklanmoqda'}
      </>
    ) : (
      children
    );

    if (as && as !== 'button') {
      const Comp = as;
      return (
        <Comp className={finalClass} {...(props as any)} ref={ref as any}>
          {content}
        </Comp>
      );
    }

    return (
      <button
        type={(props as any).type ?? 'button'}
        ref={ref}
        className={finalClass}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
