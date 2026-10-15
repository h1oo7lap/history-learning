import React, { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error = false, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(
          'flex h-11 w-full rounded-sm border border-line bg-card px-3 py-2 text-[15px] text-ink',
          'placeholder:text-muted/70 transition-colors',
          'focus:outline-none focus:border-seal focus:ring-1 focus:ring-seal',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-danger text-danger focus:border-danger focus:ring-danger',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
