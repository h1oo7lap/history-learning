'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lessonsAdminApi } from '@/features/admin/api';
import type { QuizStatus, Lesson } from '@/features/admin/api';
import { formatGrade } from '@/lib/format';

export interface QuizBasicTabProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  status: QuizStatus;
  setStatus: (val: QuizStatus) => void;
  lessonId: string;
  setLessonId: (val: string) => void;
  isEditing: boolean;
  currentLessonTitle?: string;
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

export function QuizBasicTab({
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  lessonId,
  setLessonId,
  isEditing,
  currentLessonTitle,
  errors,
  clearError,
}: QuizBasicTabProps) {
  const [lessonSearch, setLessonSearch] = useState('');
  const [isChangingLesson, setIsChangingLesson] = useState(false);

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-quiz-lesson-lookup', lessonSearch],
    queryFn: () => lessonsAdminApi.list({ search: lessonSearch || undefined, pageSize: 50 }),
  });

  const lessons: Lesson[] = lessonsData?.items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ─── 1. Tiêu đề Quiz ─── */}
      <div>
        <label className="label" htmlFor="quiz-title" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
          Tiêu đề bài kiểm tra / Quiz <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <input
          id="quiz-title"
          className={`input${errors.title ? ' error' : ''}`}
          placeholder="Ví dụ: Kiểm tra củng cố kiến thức: Chiến thắng Bạch Đằng năm 938"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearError('title');
          }}
          style={{ fontSize: '0.92rem' }}
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
          Tên hiển thị trên danh sách bài thi và trang làm bài trắc nghiệm của học sinh.
        </p>
      </div>

      {/* ─── 2. Bài học liên kết ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="label" style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
            Bài học gắn với Quiz <span style={{ color: '#dc2626' }}>*</span>
          </label>
          {isEditing && !isChangingLesson && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsChangingLesson(true)}
              style={{ fontSize: '0.78rem', color: 'var(--brand-600)' }}
            >
              🔄 Đổi bài học liên kết
            </button>
          )}
        </div>

        {isEditing && !isChangingLesson ? (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>📖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                {currentLessonTitle || lessonId}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Mỗi bài học trong chương trình có tối đa 1 bài quiz củng cố kiến thức.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '0.75rem',
              background: 'var(--surface)',
            }}
          >
            <input
              type="text"
              className="input"
              placeholder="🔍 Tìm nhanh bài học theo tên..."
              value={lessonSearch}
              onChange={(e) => setLessonSearch(e.target.value)}
              style={{ fontSize: '0.84rem', marginBottom: '0.5rem' }}
            />

            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {lessonsLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
                  Đang tải danh sách bài học...
                </div>
              ) : lessons.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
                  Không tìm thấy bài học nào phù hợp.
                </div>
              ) : (
                lessons.map((lesson) => {
                  const isSelected = lessonId === lesson.id;
                  const gradeLabel = lesson.grade ? formatGrade(lesson.grade) : '';
                  return (
                    <label
                      key={lesson.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.84rem',
                        borderBottom: '1px solid var(--border)',
                        background: isSelected ? 'var(--brand-50, rgb(99 102 241 / 0.08))' : 'transparent',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="quiz-lesson-choice"
                        value={lesson.id}
                        checked={isSelected}
                        onChange={() => {
                          setLessonId(lesson.id);
                          clearError('lessonId');
                        }}
                        style={{ accentColor: 'var(--brand-500)' }}
                      />
                      <span style={{ fontWeight: isSelected ? 600 : 400, flex: 1 }}>
                        {lesson.title}
                      </span>
                      {gradeLabel && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 4,
                            background: 'var(--surface-2)',
                            color: 'var(--muted)',
                          }}
                        >
                          {gradeLabel}
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
            {errors.lessonId && <p className="field-error">{errors.lessonId}</p>}
          </div>
        )}
      </div>

      {/* ─── 3. Mô tả & Hướng dẫn ─── */}
      <div>
        <label className="label" htmlFor="quiz-desc" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
          Mô tả & Hướng dẫn làm bài
        </label>
        <textarea
          id="quiz-desc"
          className="input"
          rows={3}
          placeholder="Mô tả nội dung trọng tâm bài quiz, số câu hỏi hoặc lời khuyên cho học sinh trước khi bắt đầu..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ resize: 'vertical', fontSize: '0.88rem' }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
          Hiển thị ở trang bắt đầu bài làm để hướng dẫn học sinh.
        </p>
      </div>

      {/* ─── 4. Trạng thái xuất bản ─── */}
      <div>
        <label className="label" htmlFor="quiz-status" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
          Trạng thái Quiz
        </label>
        <select
          id="quiz-status"
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as QuizStatus)}
          style={{ fontSize: '0.88rem' }}
        >
          <option value="DRAFT">📝 Bản nháp (DRAFT) — Chưa hiển thị cho học sinh</option>
          <option value="PUBLISHED">📢 Đã xuất bản (PUBLISHED) — Học sinh có thể làm bài</option>
          <option value="ARCHIVED">📦 Lưu trữ (ARCHIVED) — Tạm dừng bài quiz</option>
        </select>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
          Lưu ý: Để chuyển sang &ldquo;Đã xuất bản&rdquo;, bài quiz phải có ít nhất 1 câu hỏi và đáp án hợp lệ.
        </p>
      </div>
    </div>
  );
}
