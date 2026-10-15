import React, { forwardRef } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  children?: React.ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon: Icon = Inbox,
      title,
      description,
      action,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center rounded-md border border-dashed border-line bg-card/40',
          className
        )}
        {...props}
      >
        <div className="w-12 h-12 rounded-full bg-line/40 flex items-center justify-center text-muted mb-3.5">
          <Icon size={28} aria-hidden="true" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-ink mb-1.5">{title}</h3>
        {description && (
          <p className="text-sm text-muted max-w-md mb-5 leading-relaxed">{description}</p>
        )}
        {action && (
          action.href ? (
            <Button asChild variant="primary" size="sm">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )
        )}
        {children}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
