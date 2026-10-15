import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error = false, disabled, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={cn(
            'flex h-11 w-full appearance-none rounded-sm border border-line bg-card px-3 py-2 pr-10 text-[15px] text-ink',
            'transition-colors cursor-pointer',
            'focus:outline-none focus:border-seal focus:ring-1 focus:ring-seal',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-danger text-danger focus:border-danger focus:ring-danger',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
