'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DataTable,
  ConfirmDialog,
  statusColumn,
  dateColumn,
  actionButtons,
} from '@/components/admin-crud';
import type { ColumnDef } from '@/components/admin-crud';
import { useAdminResource } from '@/components/admin-crud/useAdminResource';
import {
  useAdminQuizzes,
  useAdminQuiz,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useSetQuizQuestions,
} from '@/features/admin/hooks';
import { lessonsAdminApi } from '@/features/admin/api';
import type {
  AdminQuiz,
  QuizStatus,
  QuestionType,
  QuestionPayload,
  AnswerPayload,
  Lesson,
} from '@/features/admin/api';
import { useQuery } from '@tanstack/react-query';

// ──────────────────────────────────────────────────────────────
// Column definitions
// ──────────────────────────────────────────────────────────────

const quizTitleColumn: ColumnDef<AdminQuiz> = {
  key: 'title',
  header: 'Quiz',
  render: (item) => (
    <div>
      <div style={{ fontWeight: 600 }}>{item.title}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
        📚 {item.lesson?.title ?? item.lessonId}
      </div>
    </div>
  ),
};

const quizMetaColumn: ColumnDef<AdminQuiz> = {
  key: 'passScore',
  header: 'Câu hỏi / Điểm',
  nowrap: true,
  render: (item) => (
    <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
      <div>{(item._count?.questions ?? item.questions?.length ?? 0)} câu</div>
      <div>Đạt: {item.passScore}%</div>
      {item.timeLimit && <div>⏱ {item.timeLimit}s</div>}
    </div>
  ),
};

// ──────────────────────────────────────────────────────────────
// Answer editor sub-component
// ──────────────────────────────────────────────────────────────

function AnswerEditor({
  answers,
  questionType,
  onChange,
}: {
  answers: AnswerPayload[];
  questionType: QuestionType;
  onChange: (a: AnswerPayload[]) => void;
}) {
  const isMulti = questionType === 'MULTIPLE_CHOICE';

  const add = () => onChange([...answers, { content: '', isCorrect: false }]);

  const update = (i: number, patch: Partial<AnswerPayload>) => {
    const next = answers.map((a, idx) => (idx === i ? { ...a, ...patch } : a));
    if (!isMulti && patch.isCorrect) {
      next.forEach((_, idx) => { if (idx !== i) next[idx] = { ...next[idx], isCorrect: false }; });
    }
    onChange(next);
  };

  const remove = (i: number) => onChange(answers.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {answers.map((ans, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <input
            type={isMulti ? 'checkbox' : 'radio'}
            checked={ans.isCorrect}
            onChange={(e) => update(i, { isCorrect: e.target.checked })}
            style={{ accentColor: 'var(--brand-500)', flexShrink: 0 }}
          />
          <input
            className="input"
            placeholder={`Đáp án ${i + 1}...`}
            value={ans.content}
            onChange={(e) => update(i, { content: e.target.value })}
            style={{ flex: 1, fontSize: '0.84rem' }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={answers.length <= 2}
            style={{
              border: '1px solid var(--border)', borderRadius: 4,
              width: 24, height: 24, cursor: answers.length <= 2 ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem', background: 'none',
              opacity: answers.length <= 2 ? 0.35 : 1,
              color: '#dc2626',
            }}
          >✕</button>
        </div>
      ))}
      {answers.length < 6 && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={add} style={{ alignSelf: 'flex-start', fontSize: '0.78rem' }}>
          + Thêm đáp án
        </button>
      )}
      <p style={{ fontSize: '0.7rem', color: 'var(--muted)', margin: 0 }}>
        {isMulti ? '☑️ Chọn nhiều đáp án đúng' : '🔘 Chỉ 1 đáp án đúng'}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Question editor
// ──────────────────────────────────────────────────────────────

function defaultAnswers(type: QuestionType): AnswerPayload[] {
  if (type === 'TRUE_FALSE') return [{ content: 'Đúng', isCorrect: true }, { content: 'Sai', isCorrect: false }];
  return [{ content: '', isCorrect: true }, { content: '', isCorrect: false }];
}

function QuestionEditor({
  questions,
  onChange,
}: {
  questions: QuestionPayload[];
  onChange: (q: QuestionPayload[]) => void;
}) {
  const add = () => onChange([
    ...questions,
    { content: '', type: 'SINGLE_CHOICE', points: 1, explanation: null, displayOrder: questions.length, answers: defaultAnswers('SINGLE_CHOICE') },
  ]);

  const upd = (i: number, patch: Partial<QuestionPayload>) => {
    const next = [...questions];
    const updated = { ...next[i], ...patch };
    if (patch.type && patch.type !== next[i].type) updated.answers = defaultAnswers(patch.type);
    next[i] = updated;
    onChange(next);
  };

  const del = (i: number) => onChange(questions.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) => {
    const next = [...questions];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {questions.length === 0 && (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', opacity: 0.4 }}>❓</div>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Chưa có câu hỏi. Thêm câu hỏi bên dưới.</p>
        </div>
      )}

      {questions.map((q, i) => (
        <div key={i} style={{ border: '1px solid var(--border)', borderLeft: '3px solid var(--brand-500)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--brand-600)', flex: 1 }}>Câu {i + 1}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={{ border: '1px solid var(--border)', borderRadius: 3, width: 22, height: 22, background: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1, fontSize: '0.65rem' }}>↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === questions.length - 1} style={{ border: '1px solid var(--border)', borderRadius: 3, width: 22, height: 22, background: 'none', cursor: i === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: i === questions.length - 1 ? 0.3 : 1, fontSize: '0.65rem' }}>↓</button>
            <button type="button" onClick={() => del(i)} style={{ border: '1px solid rgb(239 68 68/0.3)', borderRadius: 3, width: 22, height: 22, background: 'rgb(239 68 68/0.1)', cursor: 'pointer', fontSize: '0.65rem', color: '#dc2626' }}>✕</button>
          </div>
          <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div>
              <label className="label" style={{ fontSize: '0.76rem' }}>Nội dung câu hỏi *</label>
              <textarea className="input" rows={2} placeholder="Nhập câu hỏi..." value={q.content} onChange={(e) => upd(i, { content: e.target.value })} style={{ resize: 'vertical', minHeight: 56, fontSize: '0.84rem' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '0.5rem' }}>
              <div>
                <label className="label" style={{ fontSize: '0.76rem' }}>Loại câu hỏi</label>
                <select className="input" value={q.type} onChange={(e) => upd(i, { type: e.target.value as QuestionType })} style={{ fontSize: '0.84rem' }}>
                  <option value="SINGLE_CHOICE">1 đáp án đúng</option>
                  <option value="MULTIPLE_CHOICE">Nhiều đáp án đúng</option>
                  <option value="TRUE_FALSE">Đúng / Sai</option>
                </select>
              </div>
              <div>
                <label className="label" style={{ fontSize: '0.76rem' }}>Điểm</label>
                <input type="number" className="input" min={1} max={10} value={q.points ?? 1} onChange={(e) => upd(i, { points: Number(e.target.value) || 1 })} style={{ fontSize: '0.84rem' }} />
              </div>
            </div>
            <div>
              <label className="label" style={{ fontSize: '0.76rem' }}>Đáp án</label>
              <AnswerEditor answers={q.answers} questionType={q.type} onChange={(answers) => upd(i, { answers })} />
            </div>
            <div>
              <label className="label" style={{ fontSize: '0.76rem' }}>Giải thích (tuỳ chọn)</label>
              <input className="input" placeholder="Giải thích đáp án đúng..." value={q.explanation ?? ''} onChange={(e) => upd(i, { explanation: e.target.value || null })} style={{ fontSize: '0.82rem' }} />
            </div>
          </div>
        </div>
      ))}

      {questions.length < 50 && (
        <button type="button" onClick={add} className="btn btn-ghost" style={{ fontSize: '0.85rem', border: '2px dashed var(--border)' }}>
          + Thêm câu hỏi
        </button>
      )}
      <p style={{ fontSize: '0.76rem', color: 'var(--muted)', margin: 0 }}>{questions.length}/50 câu hỏi</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Quiz form dialog
// ──────────────────────────────────────────────────────────────

interface QuizFormProps {
  open: boolean;
  quiz: AdminQuiz | null;
  isPending: boolean;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

function QuizForm({ open, quiz, isPending, onSubmit, onClose }: QuizFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [lessonSearch, setLessonSearch] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [passScore, setPassScore] = useState('60');
  const [status, setStatus] = useState<QuizStatus>('DRAFT');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: lessonsData } = useQuery({
    queryKey: ['quiz-lesson-lookup', lessonSearch],
    queryFn: () => lessonsAdminApi.list({ search: lessonSearch || undefined, pageSize: 20 }),
    enabled: open && !quiz,
  });

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      setErrors({});
      if (quiz) {
        setTitle(quiz.title);
        setDescription(quiz.description ?? '');
        setTimeLimit(quiz.timeLimit != null ? String(quiz.timeLimit) : '');
        setPassScore(String(quiz.passScore));
        setStatus(quiz.status);
      } else {
        setTitle(''); setDescription(''); setTimeLimit('');
        setPassScore('60'); setStatus('DRAFT');
        setSelectedLessonId(''); setLessonSearch('');
      }
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, quiz]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Tiêu đề không được để trống';
    if (!quiz && !selectedLessonId) errs.lessonId = 'Vui lòng chọn bài học';
    const ps = Number(passScore);
    if (passScore && (isNaN(ps) || ps < 0 || ps > 100)) errs.passScore = 'Điểm đạt phải từ 0-100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...(quiz ? {} : { lessonId: selectedLessonId }),
      title: title.trim(),
      description: description.trim() || null,
      timeLimit: timeLimit ? Number(timeLimit) : null,
      passScore: Number(passScore) || 60,
      status,
    });
  };

  if (!open) return null;
  const lessons: Lesson[] = lessonsData?.items ?? [];

  return (
    <dialog ref={dialogRef} style={{ border: 'none', borderRadius: 'var(--radius-lg)', padding: 0, background: 'transparent', maxWidth: 560, width: '95vw', position: 'fixed', margin: 0, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{quiz ? '✏️ Sửa quiz' : '➕ Tạo quiz mới'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {!quiz && (
            <div>
              <label className="label">Bài học <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="input" placeholder="Tìm bài học..." value={lessonSearch} onChange={(e) => setLessonSearch(e.target.value)} style={{ marginBottom: '0.4rem' }} />
              {lessons.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: 150, overflowY: 'auto' }}>
                  {lessons.map((lesson) => (
                    <label key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.84rem', background: selectedLessonId === lesson.id ? 'var(--brand-50, rgb(99 102 241/0.08))' : 'transparent' }}>
                      <input type="radio" name="quiz-lesson" value={lesson.id} checked={selectedLessonId === lesson.id} onChange={() => setSelectedLessonId(lesson.id)} style={{ accentColor: 'var(--brand-500)' }} />
                      <span>{lesson.title}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.72rem', marginLeft: 'auto' }}>{lesson.status}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.lessonId && <p className="field-error">{errors.lessonId}</p>}
            </div>
          )}
          <div>
            <label className="label" htmlFor="qf-title">Tiêu đề <span style={{ color: 'var(--error)' }}>*</span></label>
            <input id="qf-title" className={`input${errors.title ? ' error' : ''}`} placeholder="Ví dụ: Trắc nghiệm Chiến thắng Bạch Đằng" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((p) => { const n = { ...p }; delete n.title; return n; }); }} />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>
          <div>
            <label className="label" htmlFor="qf-desc">Mô tả</label>
            <textarea id="qf-desc" className="input" rows={2} placeholder="Mô tả ngắn..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="qf-time">Thời gian (giây, trống = không giới hạn)</label>
              <input id="qf-time" type="number" className="input" min={30} placeholder="VD: 300" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="qf-pass">Điểm đạt (%)</label>
              <input id="qf-pass" type="number" className={`input${errors.passScore ? ' error' : ''}`} min={0} max={100} value={passScore} onChange={(e) => setPassScore(e.target.value)} />
              {errors.passScore && <p className="field-error">{errors.passScore}</p>}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="qf-status">Trạng thái</label>
            <select id="qf-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as QuizStatus)}>
              <option value="DRAFT">📝 Nháp</option>
              <option value="PUBLISHED">📢 Xuất bản</option>
              <option value="ARCHIVED">📦 Lưu trữ</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>Huỷ</button>
            <button type="submit" className="btn btn-primary" disabled={isPending} style={{ minWidth: 100 }}>
              {isPending ? '⏳ Đang lưu...' : quiz ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
      <style>{`dialog::backdrop { background: rgb(0 0 0/0.4); backdrop-filter: blur(2px); }`}</style>
    </dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Questions dialog
// ──────────────────────────────────────────────────────────────

function QuestionsDialog({ quiz, open, onClose }: { quiz: AdminQuiz | null; open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const setQuestionsM = useSetQuizQuestions();
  const { data: quizDetail, isLoading } = useAdminQuiz(open && quiz ? quiz.id : null);
  const [localQ, setLocalQ] = useState<QuestionPayload[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && quiz) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, quiz]);

  useEffect(() => {
    if (quizDetail?.questions) {
      setLocalQ(
        quizDetail.questions.map((q) => ({
          content: q.content,
          type: q.type,
          points: q.points,
          explanation: q.explanation,
          displayOrder: q.displayOrder,
          answers: (q.answers || []).map((a) => ({
            content: a.content,
            isCorrect: a.isCorrect,
            displayOrder: a.displayOrder,
          })),
        })),
      );
    } else if (open && !isLoading && !quizDetail) {
      setLocalQ([]);
    }
  }, [quizDetail, isLoading, open]);

  const validate = () => {
    if (localQ.length === 0) {
      toast.error('Quiz cần ít nhất 1 câu hỏi');
      return false;
    }
    for (let i = 0; i < localQ.length; i++) {
      const q = localQ[i];
      if (!q.content.trim()) {
        toast.error(`Câu ${i + 1}: nội dung không được để trống`);
        return false;
      }
      if (!q.answers || q.answers.length < 2) {
        toast.error(`Câu ${i + 1}: cần ít nhất 2 đáp án`);
        return false;
      }
      if (!q.answers.some((a) => a.isCorrect)) {
        toast.error(`Câu ${i + 1}: cần ít nhất 1 đáp án đúng`);
        return false;
      }
      if (q.answers.some((a) => !a.content.trim())) {
        toast.error(`Câu ${i + 1}: tất cả đáp án phải có nội dung`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!quiz || !validate()) return;
    setSaving(true);
    try {
      await setQuestionsM.mutateAsync({ id: quiz.id, questions: localQ });
      toast.success('Đã lưu câu hỏi!');
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi khi lưu câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !quiz) return null;

  return (
    <dialog
      ref={dialogRef}
      style={{
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        padding: 0,
        background: 'transparent',
        maxWidth: 720,
        width: '97vw',
        position: 'fixed',
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>❓ Quản lý câu hỏi</h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--muted)', margin: '0.1rem 0 0' }}>
              {quiz.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: 'var(--muted)',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem' }}>
          {isLoading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>⏳</div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Đang tải danh sách câu hỏi...</p>
            </div>
          ) : (
            <QuestionEditor questions={localQ} onChange={setLocalQ} />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.8rem 1.25rem',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {localQ.length} câu hỏi • Lưu sẽ ghi đè tất cả câu hỏi cũ
          </span>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Huỷ
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || isLoading || localQ.length === 0}
              style={{ minWidth: 120 }}
            >
              {saving ? '⏳ Đang lưu...' : `💾 Lưu ${localQ.length} câu hỏi`}
            </button>
          </div>
        </div>
      </div>
      <style>{`dialog::backdrop { background: rgb(0 0 0/0.4); backdrop-filter: blur(2px); }`}</style>
    </dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────

export default function AdminQuizzesPage() {
  const resource = useAdminResource<AdminQuiz>();
  const { data, isLoading, isError } = useAdminQuizzes({
    ...resource.query,
    status: resource.query.status as QuizStatus | '' | undefined,
  });
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();

  const [qDialogQuiz, setQDialogQuiz] = useState<AdminQuiz | null>(null);
  const [qDialogOpen, setQDialogOpen] = useState(false);

  const openQDialog = (quiz: AdminQuiz) => { setQDialogQuiz(quiz); setQDialogOpen(true); };
  const closeQDialog = () => { setQDialogOpen(false); setQDialogQuiz(null); };

  const handleSubmit = async (dto: any) => {
    try {
      if (resource.editing) {
        await updateQuiz.mutateAsync({ id: resource.editing.id, dto });
        toast.success('Đã cập nhật quiz!');
      } else {
        await createQuiz.mutateAsync(dto);
        toast.success('Đã tạo quiz mới!');
      }
      resource.closeModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu quiz');
    }
  };

  const handleDelete = async () => {
    if (!resource.deleteTarget) return;
    try {
      await deleteQuiz.mutateAsync(resource.deleteTarget.id);
      toast.success('Đã xoá quiz!');
      resource.setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi xoá quiz');
    }
  };

  const columns: ColumnDef<AdminQuiz>[] = [
    quizTitleColumn,
    quizMetaColumn,
    statusColumn<AdminQuiz>(),
    dateColumn<AdminQuiz>(),
  ];

  return (
    <div>
      <DataTable<AdminQuiz>
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        page={resource.page}
        pageSize={resource.pageSize}
        search={resource.search}
        statusFilter={resource.statusFilter}
        onPageChange={resource.setPage}
        onPageSizeChange={resource.setPageSize}
        onSearchChange={resource.setSearch}
        onStatusFilterChange={resource.setStatusFilter}
        statusOptions={[
          { value: 'DRAFT', label: 'Nháp' },
          { value: 'PUBLISHED', label: 'Đã xuất bản' },
          { value: 'ARCHIVED', label: 'Lưu trữ' },
        ]}
        entityLabel="Quiz"
        entityIcon="🧩"
        searchPlaceholder="Tìm quiz..."
        createLabel="+ Tạo quiz"
        onCreate={resource.openCreate}
        renderActions={(item) => (
          <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => openQDialog(item)}
              title="Quản lý câu hỏi"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
            >
              ❓ {item._count?.questions ?? item.questions?.length ?? 0} câu
            </button>
            {actionButtons<AdminQuiz>(resource.openEdit, resource.confirmDelete)(item)}
          </>
        )}
        idPrefix="quiz"
      />

      <QuizForm
        open={resource.modalOpen}
        quiz={resource.editing}
        isPending={createQuiz.isPending || updateQuiz.isPending}
        onSubmit={handleSubmit}
        onClose={resource.closeModal}
      />

      <QuestionsDialog quiz={qDialogQuiz} open={qDialogOpen} onClose={closeQDialog} />

      <ConfirmDialog
        open={!!resource.deleteTarget}
        title="Xoá quiz?"
        message={`Bạn có chắc muốn xoá quiz "${resource.deleteTarget?.title}"? Tất cả câu hỏi và đáp án sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá quiz"
        loading={deleteQuiz.isPending}
        onConfirm={handleDelete}
        onCancel={resource.cancelDelete}
      />
    </div>
  );
}