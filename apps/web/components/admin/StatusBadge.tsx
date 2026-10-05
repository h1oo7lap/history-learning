interface StatusBadgeProps {
  status: string;
  /** Override labels. Default: ACTIVE→"Hoạt động", INACTIVE→"Ẩn" */
  labels?: Record<string, string>;
  /** Override colors. Keys: bg, text, dot, border */
  colorMap?: Record<string, { bg: string; text: string; dot: string; border: string }>;
}

const DEFAULT_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  ACTIVE: {
    bg: 'rgb(16 185 129 / 0.12)',
    text: '#059669',
    dot: '#10b981',
    border: 'rgb(16 185 129 / 0.25)',
  },
  INACTIVE: {
    bg: 'rgb(100 116 139 / 0.12)',
    text: 'var(--muted)',
    dot: '#94a3b8',
    border: 'rgb(100 116 139 / 0.2)',
  },
  PUBLISHED: {
    bg: 'rgb(59 130 246 / 0.12)',
    text: '#2563eb',
    dot: '#3b82f6',
    border: 'rgb(59 130 246 / 0.25)',
  },
  DRAFT: {
    bg: 'rgb(245 158 11 / 0.12)',
    text: '#d97706',
    dot: '#f59e0b',
    border: 'rgb(245 158 11 / 0.25)',
  },
  ARCHIVED: {
    bg: 'rgb(100 116 139 / 0.12)',
    text: 'var(--muted)',
    dot: '#94a3b8',
    border: 'rgb(100 116 139 / 0.2)',
  },
  BANNED: {
    bg: 'rgb(239 68 68 / 0.12)',
    text: '#dc2626',
    dot: '#ef4444',
    border: 'rgb(239 68 68 / 0.25)',
  },
};

const DEFAULT_LABELS: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ẩn',
  PUBLISHED: 'Đã xuất bản',
  DRAFT: 'Nháp',
  ARCHIVED: 'Lưu trữ',
  BANNED: 'Cấm',
};

export function StatusBadge({ status, labels, colorMap }: StatusBadgeProps) {
  const colors = (colorMap ?? DEFAULT_COLORS)[status] ?? DEFAULT_COLORS.INACTIVE;
  const label = (labels ?? DEFAULT_LABELS)[status] ?? status;

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
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: colors.dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
