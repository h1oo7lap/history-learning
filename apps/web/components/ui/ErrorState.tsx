import React, { forwardRef } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryHref?: string;
  retryLabel?: string;
  children?: React.ReactNode;
}

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      title = 'Đã có lỗi xảy ra',
      description = 'Không thể tải được dữ liệu vào lúc này. Vui lòng thử lại sau ít phút.',
      onRetry,
      retryHref,
      retryLabel = 'Thử lại',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-4 text-center rounded-md border border-line bg-card',
          className
        )}
        {...props}
      >
        <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-3.5">
          <AlertCircle size={28} aria-hidden="true" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-ink mb-1.5">{title}</h3>
        <p className="text-sm text-muted max-w-md mb-5 leading-relaxed">{description}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw size={14} aria-hidden="true" />
            <span>{retryLabel}</span>
          </Button>
        )}
        {retryHref && (
          <Button asChild variant="secondary" size="sm" className="gap-2">
            <Link href={retryHref}>
              <RefreshCw size={14} aria-hidden="true" />
              <span>{retryLabel}</span>
            </Link>
          </Button>
        )}
        {children}
      </div>
    );
  }
);

ErrorState.displayName = 'ErrorState';
