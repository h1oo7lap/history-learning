import React, { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  default: {
    container: 'bg-line/60 text-ink-soft border-line',
    dot: 'bg-ink-soft',
  },
  success: {
    container: 'bg-success/15 text-success border-success/30',
    dot: 'bg-success',
  },
  warning: {
    container: 'bg-bronze/15 text-bronze-ink border-bronze/30',
    dot: 'bg-bronze-ink',
  },
  danger: {
    container: 'bg-danger/15 text-danger border-danger/30',
    dot: 'bg-danger',
  },
  neutral: {
    container: 'bg-line/40 text-muted border-line/60',
    dot: 'bg-muted',
  },
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', dot = false, children, ...props }, ref) => {
    const styles = variantStyles[variant];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 h-6 px-2 text-[13px] font-medium rounded-sm border select-none whitespace-nowrap',
          styles.container,
          className
        )}
        {...props}
      >
        {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', styles.dot)} aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
