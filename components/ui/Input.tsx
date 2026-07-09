/**
 * Input — uses new design tokens.
 */

import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-fg">
            {label}
            {props.required && <span className="ml-1 text-danger">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'input-base w-full',
            error && 'border-danger ring-4 ring-danger/12 focus:border-danger',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-fg-subtle">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
