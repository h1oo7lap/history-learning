import {
  slugColumn,
  statusColumn,
  dateColumn,
} from '@/components/admin-crud';
import type { ColumnDef } from '@/components/admin-crud';
import type { Lesson } from '@/features/admin/api';
import { DifficultyBadge } from './DifficultyBadge';

export const lessonTitleColumn: ColumnDef<Lesson> = {
  key: 'title',
  header: 'Bài học',
  maxWidth: 320,
  render: (item) => (
    <div style={{ maxWidth: 320, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {item.thumbnail && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.thumbnail}
            alt=""
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            title={item.title}
            style={{
              fontWeight: 600,
              color: 'var(--foreground)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </div>
          {item.summary && (
            <div
              title={item.summary}
              style={{
                color: 'var(--muted)',
                fontSize: '0.8rem',
                marginTop: '0.1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.summary}
            </div>
          )}
        </div>
      </div>
    </div>
  ),
};

export const difficultyColumn: ColumnDef<Lesson> = {
  key: 'difficulty',
  header: 'Độ khó',
  nowrap: true,
  render: (item) => <DifficultyBadge difficulty={item.difficulty} />,
};

export const gradeTagsColumn: ColumnDef<Lesson> = {
  key: 'grades',
  header: 'Lớp',
  nowrap: true,
  render: (item) => {
    const gradeName = item.grade?.name || item.grades?.[0]?.grade?.name;
    const gradeCode = item.grade?.code || item.grades?.[0]?.grade?.code;
    return (
      <div>
        {gradeName || gradeCode ? (
          <span
            style={{
              padding: '0.1rem 0.4rem',
              borderRadius: 4,
              background: 'var(--surface-2)',
              fontSize: '0.75rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {gradeCode || gradeName}
          </span>
        ) : (
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>
        )}
      </div>
    );
  },
};

export const timeColumn: ColumnDef<Lesson> = {
  key: 'estimatedTime',
  header: 'Thời gian',
  nowrap: true,
  render: (item) => (
    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>⏱ {item.estimatedTime} phút</span>
  ),
};

export const lessonColumns: ColumnDef<Lesson>[] = [
  lessonTitleColumn,
  slugColumn<Lesson>(),
  difficultyColumn,
  gradeTagsColumn,
  timeColumn,
  statusColumn<Lesson>(),
  dateColumn<Lesson>(),
];
