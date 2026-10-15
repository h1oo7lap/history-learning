import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string | null;
}

export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, message, children, id, ...props }, ref) => {
    const content = message ?? children;
    if (!content) return null;

    return (
      <p
        ref={ref}
        id={id}
        role="alert"
        className={cn(
          'flex items-center gap-1.5 text-[14px] text-danger mt-1.5 leading-tight',
          className
        )}
        {...props}
      >
        <AlertCircle size={15} className="shrink-0" aria-hidden="true" />
        <span>{content}</span>
      </p>
    );
  }
);

FieldError.displayName = 'FieldError';
