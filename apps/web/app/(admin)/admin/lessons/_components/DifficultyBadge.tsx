export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
};

export const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EASY: { bg: 'rgb(16 185 129 / 0.1)', text: '#059669', border: 'rgb(16 185 129 / 0.2)' },
  MEDIUM: { bg: 'rgb(245 158 11 / 0.1)', text: '#d97706', border: 'rgb(245 158 11 / 0.2)' },
  HARD: { bg: 'rgb(239 68 68 / 0.1)', text: '#dc2626', border: 'rgb(239 68 68 / 0.2)' },
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.EASY;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.15rem 0.55rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {difficulty === 'EASY' && '🟢'}
      {difficulty === 'MEDIUM' && '🟡'}
      {difficulty === 'HARD' && '🔴'}
      {DIFFICULTY_LABELS[difficulty] ?? difficulty}
    </span>
  );
}
