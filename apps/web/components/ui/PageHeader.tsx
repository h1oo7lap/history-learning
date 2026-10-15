import React, { forwardRef } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, breadcrumbs, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn('mb-6 md:mb-8 space-y-3', className)}
        {...props}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted mb-2">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <ChevronRight size={13} className="shrink-0 text-muted/60" aria-hidden="true" />
                  )}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-ink transition-colors underline-offset-2 hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={cn(isLast && 'font-medium text-ink-soft')} aria-current={isLast ? 'page' : undefined}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-ink">
              {title}
            </h1>
            {description && (
              <p className="text-sm md:text-base text-muted max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
              {actions}
            </div>
          )}
        </div>
      </header>
    );
  }
);

PageHeader.displayName = 'PageHeader';
