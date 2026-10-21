'use client';

import { useMemo } from 'react';
import type { QuestionPayload } from '@/features/admin/api';

export interface QuizSettingsTabProps {
  timeLimit: string; // stored as seconds in string form, '' means unlimited
  setTimeLimit: (val: string) => void;
  passScore: string; // 0..100
  setPassScore: (val: string) => void;
  questions: QuestionPayload[];
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

export function QuizSettingsTab({
  timeLimit,
  setTimeLimit,
  passScore,
  setPassScore,
  questions,
  errors,
  clearError,
}: QuizSettingsTabProps) {
  const timeLimitNum = Number(timeLimit) || 0;
  const passScoreNum = Number(passScore) || 60;

  // Presets for time limit (in seconds)
  const timePresets = [
    { label: 'Không giới hạn', value: '' },
    { label: '5 phút', value: '300' },
    { label: '10 phút', value: '600' },
    { label: '15 phút', value: '900' },
    { label: '20 phút', value: '1200' },
    { label: '30 phút', value: '1800' },
    { label: '45 phút', value: '2700' },
  ];

  // Presets for pass score
  const scorePresets = ['50', '60', '70', '80', '100'];

  // Calculations
  const stats = useMemo(() => {
    const totalQuestions = questions.length;
    const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    const avgPointsPerQ = totalQuestions > 0 ? (totalPoints / totalQuestions).toFixed(1) : '1.0';
    const minPassQuestions = Math.ceil((totalQuestions * passScoreNum) / 100);

    return {
      totalQuestions,
      totalPoints,
      avgPointsPerQ,
      minPassQuestions,
    };
  }, [questions, passScoreNum]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ─── 1. Thời gian làm bài ─── */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '1.25rem',
          background: 'var(--surface-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <label
              className="label"
              htmlFor="quiz-time-limit"
              style={{ fontWeight: 600, fontSize: '0.92rem', margin: 0 }}
            >
              ⏱️ Thời gian làm bài (giây)
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>
              Học sinh sẽ có bộ đếm ngược. Để trống hoặc chọn &ldquo;Không giới hạn&rdquo; nếu không muốn giới hạn thời gian.
            </p>
          </div>
          {timeLimitNum > 0 && (
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--brand-600)',
                background: 'var(--surface)',
                padding: '0.25rem 0.6rem',
                borderRadius: 4,
                border: '1px solid var(--border)',
              }}
            >
              {Math.floor(timeLimitNum / 60)} phút {timeLimitNum % 60 > 0 ? `${timeLimitNum % 60}s` : ''}
            </span>
          )}
        </div>

        {/* Nút chọn nhanh */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {timePresets.map((preset) => {
            const isSelected = timeLimit === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setTimeLimit(preset.value);
                  clearError('timeLimit');
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 6,
                  border: isSelected ? '1px solid var(--brand-500)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--brand-500)' : 'var(--surface)',
                  color: isSelected ? '#fff' : 'inherit',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            id="quiz-time-limit"
            type="number"
            min={0}
            step={30}
            placeholder="Nhập số giây tùy chỉnh (ví dụ: 600 cho 10 phút)..."
            className={`input${errors.timeLimit ? ' error' : ''}`}
            value={timeLimit}
            onChange={(e) => {
              setTimeLimit(e.target.value);
              clearError('timeLimit');
            }}
            style={{ fontSize: '0.88rem' }}
          />
        </div>
        {errors.timeLimit && <p className="field-error">{errors.timeLimit}</p>}
      </div>

      {/* ─── 2. Điểm đạt tối thiểu ─── */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '1.25rem',
          background: 'var(--surface-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <label
              className="label"
              htmlFor="quiz-pass-score"
              style={{ fontWeight: 600, fontSize: '0.92rem', margin: 0 }}
            >
              🎯 Điểm đạt tối thiểu (%) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0.2rem 0 0 0' }}>
              Tỷ lệ phần trăm điểm số học sinh cần đạt được để được tính là &ldquo;Hoàn thành&rdquo; bài quiz.
            </p>
          </div>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: passScoreNum >= 80 ? '#16a34a' : passScoreNum >= 50 ? 'var(--brand-600)' : '#ea580c',
              background: 'var(--surface)',
              padding: '0.25rem 0.65rem',
              borderRadius: 4,
              border: '1px solid var(--border)',
            }}
          >
            {passScoreNum}%
          </span>
        </div>

        {/* Nút chọn nhanh % */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {scorePresets.map((val) => {
            const isSelected = passScore === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setPassScore(val);
                  clearError('passScore');
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 6,
                  border: isSelected ? '1px solid var(--brand-500)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--brand-500)' : 'var(--surface)',
                  color: isSelected ? '#fff' : 'inherit',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {val}%
              </button>
            );
          })}
        </div>

        {/* Thanh trực quan tỷ lệ đạt */}
        <div style={{ marginTop: '0.5rem' }}>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: 'var(--border)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, passScoreNum))}%`,
                height: '100%',
                background: passScoreNum >= 80 ? '#16a34a' : passScoreNum >= 50 ? 'var(--brand-500)' : '#ea580c',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: 'var(--muted)',
              marginTop: '0.35rem',
            }}
          >
            <span>0% (Dễ)</span>
            <span>50% (Trung bình)</span>
            <span>60% (Chuẩn)</span>
            <span>80% (Khá)</span>
            <span>100% (Hoàn hảo)</span>
          </div>
        </div>

        {errors.passScore && <p className="field-error">{errors.passScore}</p>}
      </div>

      {/* ─── 3. Thẻ thống kê bài thi ─── */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '1rem 1.25rem',
          background: 'var(--surface)',
        }}
      >
        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.86rem', fontWeight: 600, color: 'var(--muted)' }}>
          📊 THỐNG KÊ TỰ ĐỘNG CỦA BÀI THI
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Tổng câu hỏi</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
              {stats.totalQuestions}
            </div>
          </div>

          <div style={{ padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Tổng điểm bài thi</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-600)', marginTop: '0.2rem' }}>
              {stats.totalPoints} đ
            </div>
          </div>

          <div style={{ padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Điểm TB / câu</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '0.2rem' }}>
              {stats.avgPointsPerQ} đ
            </div>
          </div>

          <div style={{ padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Số câu cần đạt tối thiểu</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a', marginTop: '0.2rem' }}>
              ≥ {stats.minPassQuestions} câu
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
