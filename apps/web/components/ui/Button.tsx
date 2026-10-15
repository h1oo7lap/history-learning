import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}): string {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-md transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-seal text-paper hover:bg-seal-dark active:bg-seal-dark shadow-sm',
    secondary: 'border border-ink text-ink bg-transparent hover:bg-line/40 active:bg-line/60',
    ghost: 'text-ink bg-transparent hover:bg-line/40 active:bg-line/60',
    danger: 'bg-danger text-paper hover:bg-[#991b1b] active:bg-[#991b1b]',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-sm gap-1.5',
    md: 'h-11 px-4 text-[15px] gap-2',
    lg: 'h-[52px] px-6 text-base gap-2.5',
  };

  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const classNames = buttonStyles({ variant, size, className });

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        className: cn(classNames, (children.props as { className?: string }).className),
        'aria-busy': loading || undefined,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        className={classNames}
        disabled={disabled || loading}
        aria-busy={loading ? 'true' : undefined}
        {...props}
      >
        {loading && (
          <Loader2
            className="animate-spin shrink-0"
            size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
