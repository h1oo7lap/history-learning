'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

// ─── PageSkeleton ─────────────────────────────────────────────
interface PageSkeletonProps {
  rows?: number;
  hasHeader?: boolean;
}

export function PageSkeleton({ rows = 4, hasHeader = true }: PageSkeletonProps) {
  return (
    <div className="container-page" style={{ padding: 'clamp(1.5rem,4vw,2.5rem) clamp(1rem,4vw,2rem)' }}>
      {hasHeader && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: 32, width: 240, marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: 18, width: 360 }} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1 }}>{icon}</div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--muted)', maxWidth: 400, marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <a href={action.href} className="btn btn-primary">{action.label}</a>
        ) : (
          <button className="btn btn-primary" onClick={action.onClick}>{action.label}</button>
        )
      )}
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  description = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgb(239 68 68 / 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1rem',
      }}>
        <AlertCircle size={32} color="var(--error)" />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--muted)', maxWidth: 400, marginBottom: '1.5rem', lineHeight: 1.6 }}>
        {description}
      </p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry}>
          <RefreshCw size={16} /> Thử lại
        </button>
      )}
    </div>
  );
}

// ─── Forbidden ────────────────────────────────────────────────
export function Forbidden() {
  return (
    <EmptyState
      icon="🔒"
      title="Không có quyền truy cập"
      description="Bạn không có quyền xem trang này."
      action={{ label: 'Về trang chủ', href: '/dashboard' }}
    />
  );
}
