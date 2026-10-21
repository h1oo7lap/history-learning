'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAdminQuiz } from '@/features/admin/hooks';
import type {
  AdminQuiz,
  CreateQuizPayload,
  UpdateQuizPayload,
  QuizStatus,
  QuestionPayload,
} from '@/features/admin/api';
import type { QuizTabKey, QuizTabItem } from './types';
import { QuizBasicTab } from './QuizBasicTab';
import { QuizSettingsTab } from './QuizSettingsTab';
import { QuizQuestionsTab } from './QuizQuestionsTab';

export interface QuizFormProps {
  open: boolean;
  quiz: AdminQuiz | null;
  initialTab?: QuizTabKey;
  isPending: boolean;
  onSubmit: (data: {
    quizDto: CreateQuizPayload | UpdateQuizPayload;
    questions: QuestionPayload[];
  }) => Promise<void>;
  onClose: () => void;
}

export function QuizForm({
  open,
  quiz,
  initialTab = 'basic',
  isPending,
  onSubmit,
  onClose,
}: QuizFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<QuizTabKey>(initialTab);

  // Load detailed quiz data (including questions & answers) when editing
  const { data: quizDetail, isLoading: quizDetailLoading } = useAdminQuiz(open && quiz ? quiz.id : null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [passScore, setPassScore] = useState('60');
  const [status, setStatus] = useState<QuizStatus>('DRAFT');
  const [lessonId, setLessonId] = useState('');
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  // Reset or initialize state when opening modal
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open) {
      setActiveTab(initialTab);
      setErrors({});

      if (quiz) {
        setTitle(quiz.title);
        setDescription(quiz.description ?? '');
        setTimeLimit(quiz.timeLimit != null ? String(quiz.timeLimit) : '');
        setPassScore(String(quiz.passScore ?? 60));
        setStatus(quiz.status);
        setLessonId(quiz.lessonId ?? '');
        // Questions will be updated when quizDetail is loaded
      } else {
        setTitle('');
        setDescription('');
        setTimeLimit('');
        setPassScore('60');
        setStatus('DRAFT');
        setLessonId('');
        setQuestions([]);
      }

      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, quiz, initialTab]);

  // Sync questions when quizDetail arrives
  useEffect(() => {
    if (quizDetail?.questions) {
      setQuestions(
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
    }
  }, [quizDetail]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Tiêu đề không được để trống';
    }

    if (!quiz && !lessonId) {
      errs.lessonId = 'Vui lòng chọn bài học gắn với quiz';
    }

    const ps = Number(passScore);
    if (isNaN(ps) || ps < 0 || ps > 100) {
      errs.passScore = 'Điểm đạt phải từ 0 đến 100%';
    }

    if (timeLimit && (isNaN(Number(timeLimit)) || Number(timeLimit) < 0)) {
      errs.timeLimit = 'Thời gian làm bài không hợp lệ';
    }

    // Nếu chọn PUBLISHED, bắt buộc phải có câu hỏi hợp lệ
    if (status === 'PUBLISHED') {
      if (questions.length === 0) {
        toast.error('Quiz chưa có câu hỏi nào. Không thể xuất bản!');
        setActiveTab('questions');
        return false;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]!;
        if (!q.content.trim()) {
          toast.error(`Câu ${i + 1}: Nội dung câu hỏi không được để trống.`);
          setActiveTab('questions');
          return false;
        }
        if (!q.answers || q.answers.length < 2) {
          toast.error(`Câu ${i + 1}: Cần ít nhất 2 đáp án lựa chọn.`);
          setActiveTab('questions');
          return false;
        }
        if (!q.answers.some((a) => a.isCorrect)) {
          toast.error(`Câu ${i + 1}: Chưa chọn đáp án đúng.`);
          setActiveTab('questions');
          return false;
        }
        if (q.answers.some((a) => !a.content.trim())) {
          toast.error(`Câu ${i + 1}: Có đáp án đang để trống nội dung.`);
          setActiveTab('questions');
          return false;
        }
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.title || errs.lessonId) {
        setActiveTab('basic');
      } else if (errs.passScore || errs.timeLimit) {
        setActiveTab('settings');
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const quizDto: CreateQuizPayload | UpdateQuizPayload = {
      ...(lessonId ? { lessonId } : {}),
      title: title.trim(),
      description: description.trim() || null,
      timeLimit: timeLimit ? Number(timeLimit) : null,
      passScore: Number(passScore) || 60,
      status,
    };

    await onSubmit({ quizDto, questions });
  };

  if (!open) return null;

  const tabs: QuizTabItem[] = [
    { key: 'basic', label: 'Thông tin cơ bản', icon: '📋' },
    { key: 'settings', label: 'Cài đặt & Điểm số', icon: '⚙️' },
    {
      key: 'questions',
      label: `Bộ câu hỏi`,
      icon: '❓',
      badge: questions.length,
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      style={{
        border: 'none',
        borderRadius: 12,
        padding: 0,
        background: 'transparent',
        maxWidth: 820,
        width: '96vw',
        position: 'fixed',
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🧩</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {quiz ? 'Chỉnh sửa bài Quiz' : 'Tạo bài Quiz mới'}
              </h2>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                Quản lý thông tin bài thi, quy định thời gian, điểm số và toàn bộ câu hỏi
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            title="Đóng modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: 'var(--muted)',
              lineHeight: 1,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid var(--border)',
            padding: '0 1.25rem',
            background: 'var(--surface-2)',
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.65rem 1.1rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--brand-600)' : 'var(--muted)',
                  background: 'none',
                  borderBottom: isActive ? '2px solid var(--brand-500)' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  marginBottom: '-1px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: 10,
                      background: isActive ? 'var(--brand-500)' : 'var(--border)',
                      color: isActive ? '#fff' : 'inherit',
                      fontWeight: 600,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Form Body Container */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {quizDetailLoading && quiz && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  marginBottom: '1rem',
                  background: 'var(--surface-2)',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>⏳ Đang tải dữ liệu câu hỏi chi tiết...</span>
              </div>
            )}

            {/* TAB 1: Cơ bản */}
            {activeTab === 'basic' && (
              <QuizBasicTab
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                status={status}
                setStatus={setStatus}
                lessonId={lessonId}
                setLessonId={setLessonId}
                isEditing={Boolean(quiz)}
                currentLessonTitle={quiz?.lesson?.title}
                errors={errors}
                clearError={clearError}
              />
            )}

            {/* TAB 2: Cài đặt & Điểm số */}
            {activeTab === 'settings' && (
              <QuizSettingsTab
                timeLimit={timeLimit}
                setTimeLimit={setTimeLimit}
                passScore={passScore}
                setPassScore={setPassScore}
                questions={questions}
                errors={errors}
                clearError={clearError}
              />
            )}

            {/* TAB 3: Bộ câu hỏi & Đáp án */}
            {activeTab === 'questions' && (
              <QuizQuestionsTab questions={questions} setQuestions={setQuestions} />
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.5rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {questions.length} câu hỏi • Điểm đạt: {passScore}%
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
                Huỷ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{ minWidth: 140, fontWeight: 600 }}
              >
                {isPending ? '⏳ Đang lưu...' : quiz ? '💾 Lưu thay đổi' : '➕ Tạo bài Quiz'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`dialog::backdrop { background: rgb(0 0 0/0.45); backdrop-filter: blur(2px); }`}</style>
    </dialog>
  );
}
