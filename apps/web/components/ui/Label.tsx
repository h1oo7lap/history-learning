import React, { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required = false, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-[14px] font-medium text-ink-soft select-none mb-1.5',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-danger ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';
