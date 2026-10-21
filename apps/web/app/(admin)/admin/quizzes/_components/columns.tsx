import { statusColumn, dateColumn } from '@/components/admin-crud';
import type { ColumnDef } from '@/components/admin-crud';
import type { AdminQuiz } from '@/features/admin/api';

export const quizTitleColumn: ColumnDef<AdminQuiz> = {
  key: 'title',
  header: 'Bài Quiz',
  render: (item) => (
    <div style={{ maxWidth: 300 }}>
      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{item.title}</div>
      {item.description && (
        <div
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
  key: 'lessonId',
  header: 'Bài học liên kết',
  render: (item) => (
    <div style={{ fontSize: '0.85rem' }}>
      <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>
        📖 {item.lesson?.title ?? item.lessonId}
      </div>
    </div>
  ),
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
