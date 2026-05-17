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
    'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'disabled:opacity-50 disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'text-white',
          'bg-brand-primary hover:bg-brand-primary',
          'shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_0_rgb(31_122_82/0.4),0_6px_14px_-4px_rgb(31_122_82/0.45)]',
          'hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_2px_0_rgb(31_122_82/0.5),0_12px_22px_-6px_rgb(31_122_82/0.55)]',
          'active:translate-y-0',
        ].join(' '),
        secondary: 'bg-bg-elevated text-fg border border-border-strong hover:bg-bg-subtle hover:-translate-y-px shadow-soft',
        outline: 'border border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary/8',
        ghost: 'bg-transparent text-fg hover:bg-bg-subtle',
        danger: 'bg-danger text-white hover:bg-danger/90 hover:-translate-y-px',
        success: 'bg-success text-white hover:bg-success/90 hover:-translate-y-px',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm rounded-[10px]',
        md: 'h-11 px-5 text-[15px] rounded-xl',
        lg: 'h-13 px-7 text-base rounded-[14px]',
        xl: 'h-15 px-8 text-[17px] rounded-2xl',
        icon: 'h-11 w-11 p-0 rounded-xl',
        'icon-sm': 'h-9 w-9 p-0 rounded-[10px]',
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
