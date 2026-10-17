import type { Dispatch, SetStateAction } from 'react';
import type { Difficulty, LessonStatus } from '@/features/admin/api';

export interface LessonMetaTabProps {
  difficulty: Difficulty;
  setDifficulty: Dispatch<SetStateAction<Difficulty>>;
  estimatedTime: string;
  setEstimatedTime: Dispatch<SetStateAction<string>>;
  displayOrder: string;
  setDisplayOrder: Dispatch<SetStateAction<string>>;
  status: LessonStatus;
  setStatus: Dispatch<SetStateAction<LessonStatus>>;
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

export function LessonMetaTab({
  difficulty,
  setDifficulty,
  estimatedTime,
  setEstimatedTime,
  displayOrder,
  setDisplayOrder,
  status,
  setStatus,
  errors,
  clearError,
}: LessonMetaTabProps) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Difficulty */}
        <div>
          <label className="label" htmlFor="lesson-difficulty">
            Độ khó
          </label>
          <select
            id="lesson-difficulty"
            className="input"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            <option value="EASY">🟢 Dễ</option>
            <option value="MEDIUM">🟡 Trung bình</option>
            <option value="HARD">🔴 Khó</option>
          </select>
        </div>

        {/* Estimated Time */}
        <div>
          <label className="label" htmlFor="lesson-time">
            Thời gian (phút)
          </label>
          <input
            id="lesson-time"
            className={`input${errors.estimatedTime ? 'error' : ''}`}
            type="number"
            min={1}
            max={180}
            value={estimatedTime}
            onChange={(e) => {
              setEstimatedTime(e.target.value);
              clearError('estimatedTime');
            }}
          />
          {errors.estimatedTime && <p className="field-error">{errors.estimatedTime}</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Display Order */}
        <div>
          <label className="label" htmlFor="lesson-order">
            Thứ tự hiển thị
          </label>
          <input
            id="lesson-order"
            className={`input${errors.displayOrder ? 'error' : ''}`}
            type="number"
            value={displayOrder}
            onChange={(e) => {
              setDisplayOrder(e.target.value);
              clearError('displayOrder');
            }}
          />
          {errors.displayOrder && <p className="field-error">{errors.displayOrder}</p>}
        </div>

        {/* Status */}
        <div>
          <label className="label" htmlFor="lesson-status">
            Trạng thái
          </label>
          <select
            id="lesson-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as LessonStatus)}
          >
            <option value="DRAFT">📝 Nháp</option>
            <option value="PUBLISHED">📢 Xuất bản</option>
            <option value="ARCHIVED">📦 Lưu trữ</option>
          </select>
        </div>
      </div>

      {/* Status info */}
      {status === 'PUBLISHED' && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgb(59 130 246 / 0.08)',
            border: '1px solid rgb(59 130 246 / 0.2)',
            fontSize: '0.85rem',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>ℹ️</span>
          <span>Để xuất bản, bài học cần có tiêu đề, nội dung và ít nhất 1 lớp.</span>
        </div>
      )}
    </>
  );
}
