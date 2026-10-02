import type { PublishStatus } from '@/features/admin/api';

interface StatusBadgeProps {
  status: PublishStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.65rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: isActive ? 'rgb(16 185 129 / 0.12)' : 'rgb(100 116 139 / 0.12)',
        color: isActive ? '#059669' : 'var(--muted)',
        border: `1px solid ${isActive ? 'rgb(16 185 129 / 0.25)' : 'rgb(100 116 139 / 0.2)'}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isActive ? '#10b981' : '#94a3b8',
          flexShrink: 0,
        }}
      />
      {isActive ? 'Hoạt động' : 'Ẩn'}
    </span>
  );
}
