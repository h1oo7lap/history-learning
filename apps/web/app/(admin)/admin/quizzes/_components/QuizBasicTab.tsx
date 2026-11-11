'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lessonsAdminApi } from '@/features/admin/api';
import { useGradeOptions } from '@/features/admin/hooks';
import type { QuizStatus, Lesson } from '@/features/admin/api';
import { formatGrade } from '@/lib/format';

export interface QuizBasicTabProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  status: QuizStatus;
  setStatus: (val: QuizStatus) => void;
  gradeId: string;
  setGradeId: (val: string) => void;
  lessonIds: string[];
  setLessonIds: (val: string[]) => void;
  isEditing: boolean;
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
  gradeId,
  setGradeId,
  lessonIds,
  setLessonIds,
  isEditing,
  errors,
  clearError,
}: QuizBasicTabProps) {
  const [lessonSearch, setLessonSearch] = useState('');
  const { data: gradeOptions = [] } = useGradeOptions();

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-quiz-lesson-lookup', gradeId, lessonSearch],
    queryFn: () =>
      lessonsAdminApi.list({
        gradeId: gradeId || undefined,
        search: lessonSearch || undefined,
        pageSize: 100,
      }),
    enabled: Boolean(gradeId),
  });

  const lessons: Lesson[] = lessonsData?.items ?? [];

  const handleToggleLesson = (id: string) => {
    if (lessonIds.includes(id)) {
      setLessonIds(lessonIds.filter((lid) => lid !== id));
    } else {
      setLessonIds([...lessonIds, id]);
    }
  };

  const handleSelectAllLessons = () => {
    const allIds = lessons.map((l) => l.id);
    const combined = Array.from(new Set([...lessonIds, ...allIds]));
    setLessonIds(combined);
  };

  const handleDeselectAllLessons = () => {
    const currentGradeLessonIds = new Set(lessons.map((l) => l.id));
    setLessonIds(lessonIds.filter((id) => !currentGradeLessonIds.has(id)));
  };

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

      {/* ─── 2. Khối lớp ─── */}
      <div>
        <label className="label" htmlFor="quiz-grade" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
          Khối lớp áp dụng <span style={{ color: '#dc2626' }}>*</span>
        </label>
        <select
          id="quiz-grade"
          className={`input${errors.gradeId ? ' error' : ''}`}
          value={gradeId}
          onChange={(e) => {
            const nextGradeId = e.target.value;
            setGradeId(nextGradeId);
            setLessonIds([]); // Reset selected lessons when changing grade
            clearError('gradeId');
          }}
          style={{ fontSize: '0.88rem' }}
        >
          <option value="">-- Chọn khối lớp --</option>
          {gradeOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {errors.gradeId && <p className="field-error">{errors.gradeId}</p>}
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
          Mỗi bài quiz thuộc về một khối lớp nhất định (như bài học).
        </p>
      </div>

      {/* ─── 3. Các bài học liên kết ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label className="label" style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
            Bài học liên kết của lớp{' '}
            <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--muted)' }}>
              ({lessonIds.length} bài đã chọn — có thể chọn nhiều hoặc để trống)
            </span>
          </label>
          {gradeId && lessons.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleSelectAllLessons}
                style={{ fontSize: '0.75rem', color: 'var(--brand-600)', padding: '0.15rem 0.4rem' }}
              >
                ✓ Chọn tất cả
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleDeselectAllLessons}
                style={{ fontSize: '0.75rem', color: 'var(--muted)', padding: '0.15rem 0.4rem' }}
              >
                ✕ Bỏ chọn
              </button>
            </div>
          )}
        </div>

        {!gradeId ? (
          <div
            style={{
              padding: '1rem',
              borderRadius: 6,
              border: '1px dashed var(--border)',
              background: 'var(--surface-2)',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '0.82rem',
            }}
          >
            Vui lòng chọn khối lớp ở trên để tải danh sách các bài học tương ứng.
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
                maxHeight: 200,
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
                  Không tìm thấy bài học nào của khối lớp này.
                </div>
              ) : (
                lessons.map((lesson) => {
                  const isChecked = lessonIds.includes(lesson.id);
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
                        background: isChecked ? 'var(--brand-50, rgb(99 102 241 / 0.08))' : 'transparent',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleLesson(lesson.id)}
                        style={{ accentColor: 'var(--brand-500)', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: isChecked ? 600 : 400, flex: 1 }}>
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
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
              💡 Để trống nếu quiz dành cho toàn bộ khối lớp (học sinh chỉ cần đạt quyền xem lớp để làm). Nếu chọn bài học, học sinh cần hoàn thành các bài học này để mở khóa quiz.
            </p>
          </div>
        )}
      </div>

      {/* ─── 4. Mô tả & Hướng dẫn ─── */}
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

      {/* ─── 5. Trạng thái xuất bản ─── */}
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
