import { statusColumn, dateColumn } from '@/components/admin-crud';
import type { ColumnDef } from '@/components/admin-crud';
import type { AdminQuiz } from '@/features/admin/api';

export const quizTitleColumn: ColumnDef<AdminQuiz> = {
  key: 'title',
  header: 'Bài Quiz',
  maxWidth: 300,
  render: (item) => (
    <div style={{ maxWidth: 300, minWidth: 0 }}>
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
      {item.description && (
        <div
          title={item.description}
          style={{
            fontSize: '0.78rem',
            color: 'var(--muted)',
            marginTop: '0.15rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.description}
        </div>
      )}
    </div>
  ),
};

export const quizLessonColumn: ColumnDef<AdminQuiz> = {
  key: 'gradeId',
  header: 'Khối lớp & Bài học',
  maxWidth: 260,
  render: (item) => {
    const gradeName = item.grade?.name ?? '—';
    const lessonCount = item.lessons?.length ?? 0;
    const lessonTitles = item.lessons?.map((l) => l.lesson.title).join(', ') ?? '';

    return (
      <div
        title={lessonTitles || `${gradeName} (Toàn khối lớp)`}
        style={{
          fontSize: '0.85rem',
          maxWidth: 260,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
          🎓 {gradeName}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
          {lessonCount === 0 ? (
            <span>📖 Toàn khối lớp</span>
          ) : lessonCount === 1 ? (
            <span>📖 {item.lessons![0].lesson.title}</span>
          ) : (
            <span>📖 {lessonCount} bài học liên kết</span>
          )}
        </div>
      </div>
    );
  },
};

export const quizQuestionsColumn: ColumnDef<AdminQuiz> = {
  key: 'passScore',
  header: 'Câu hỏi / Điểm đạt',
  nowrap: true,
  render: (item) => {
    const qCount = item._count?.questions ?? item.questions?.length ?? 0;
    return (
      <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
          {qCount} câu hỏi
        </div>
        <div>Yêu cầu đạt: {item.passScore}%</div>
      </div>
    );
  },
};

export const quizTimeColumn: ColumnDef<AdminQuiz> = {
  key: 'timeLimit',
  header: 'Thời gian',
  nowrap: true,
  render: (item) => {
    if (!item.timeLimit) {
      return <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Không giới hạn</span>;
    }
    const mins = Math.floor(item.timeLimit / 60);
    const secs = item.timeLimit % 60;
    return (
      <span style={{ fontSize: '0.82rem', color: 'var(--foreground)' }}>
        ⏱ {mins > 0 ? `${mins} phút` : ''} {secs > 0 ? `${secs}s` : ''}
      </span>
    );
  },
};

export const quizColumns: ColumnDef<AdminQuiz>[] = [
  quizTitleColumn,
  quizLessonColumn,
  quizQuestionsColumn,
  quizTimeColumn,
  statusColumn<AdminQuiz>(),
  dateColumn<AdminQuiz>(),
];
