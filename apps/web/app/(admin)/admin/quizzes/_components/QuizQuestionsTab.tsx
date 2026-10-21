'use client';

import type { QuestionPayload, AnswerPayload, QuestionType } from '@/features/admin/api';

export interface QuizQuestionsTabProps {
  questions: QuestionPayload[];
  setQuestions: (q: QuestionPayload[]) => void;
}

function defaultAnswers(type: QuestionType): AnswerPayload[] {
  if (type === 'TRUE_FALSE') {
    return [
      { content: 'Đúng', isCorrect: true, displayOrder: 0 },
      { content: 'Sai', isCorrect: false, displayOrder: 1 },
    ];
  }
  return [
    { content: '', isCorrect: true, displayOrder: 0 },
    { content: '', isCorrect: false, displayOrder: 1 },
    { content: '', isCorrect: false, displayOrder: 2 },
    { content: '', isCorrect: false, displayOrder: 3 },
  ];
}

export function QuizQuestionsTab({ questions, setQuestions }: QuizQuestionsTabProps) {
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        content: '',
        type: 'SINGLE_CHOICE',
        points: 1,
        explanation: null,
        displayOrder: questions.length,
        answers: defaultAnswers('SINGLE_CHOICE'),
      },
    ]);
  };

  const duplicateQuestion = (index: number) => {
    const target = questions[index];
    if (!target) return;
    const cloned: QuestionPayload = {
      ...target,
      content: `${target.content} (Bản sao)`,
      displayOrder: questions.length,
      answers: target.answers.map((a, i) => ({ ...a, displayOrder: i })),
    };
    const next = [...questions];
    next.splice(index + 1, 0, cloned);
    setQuestions(next);
  };

  const updateQuestion = (index: number, patch: Partial<QuestionPayload>) => {
    const next = [...questions];
    const current = next[index];
    if (!current) return;

    const updated = { ...current, ...patch };

    // If changing type to/from TRUE_FALSE, reset answers to standard
    if (patch.type && patch.type !== current.type) {
      if (patch.type === 'TRUE_FALSE') {
        updated.answers = defaultAnswers('TRUE_FALSE');
      } else if (current.type === 'TRUE_FALSE') {
        updated.answers = defaultAnswers(patch.type);
      } else if (patch.type === 'SINGLE_CHOICE') {
        // Ensure only first correct answer stays correct
        let hasCorrect = false;
        updated.answers = current.answers.map((a) => {
          if (a.isCorrect && !hasCorrect) {
            hasCorrect = true;
            return a;
          }
          return { ...a, isCorrect: false };
        });
        if (!hasCorrect && updated.answers[0]) {
          updated.answers[0].isCorrect = true;
        }
      }
    }

    next[index] = updated;
    setQuestions(next);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const next = [...questions];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[index]!;
    next[index] = next[targetIdx]!;
    next[targetIdx] = temp;
    setQuestions(next);
  };

  // Answer operations
  const addAnswer = (qIndex: number) => {
    const q = questions[qIndex];
    if (!q || q.answers.length >= 6) return;
    const nextAnswers: AnswerPayload[] = [
      ...q.answers,
      { content: '', isCorrect: false, displayOrder: q.answers.length },
    ];
    updateQuestion(qIndex, { answers: nextAnswers });
  };

  const updateAnswer = (qIndex: number, aIndex: number, patch: Partial<AnswerPayload>) => {
    const q = questions[qIndex];
    if (!q) return;

    let nextAnswers = q.answers.map((a, idx) => (idx === aIndex ? { ...a, ...patch } : a));

    // If SINGLE_CHOICE or TRUE_FALSE and setting isCorrect to true, uncheck others
    if (patch.isCorrect && (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE')) {
      nextAnswers = nextAnswers.map((a, idx) => ({
        ...a,
        isCorrect: idx === aIndex,
      }));
    }

    updateQuestion(qIndex, { answers: nextAnswers });
  };

  const removeAnswer = (qIndex: number, aIndex: number) => {
    const q = questions[qIndex];
    if (!q || q.answers.length <= 2) return;
    const nextAnswers = q.answers.filter((_, idx) => idx !== aIndex);
    updateQuestion(qIndex, { answers: nextAnswers });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Thanh công cụ quản lý câu hỏi */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
            Danh sách câu hỏi ({questions.length} câu)
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
            (Tối đa 50 câu)
          </span>
        </div>

        <button
          type="button"
          onClick={addQuestion}
          disabled={questions.length >= 50}
          className="btn btn-primary btn-sm"
          style={{ fontSize: '0.84rem', gap: '0.35rem' }}
        >
          ➕ Thêm câu hỏi mới
        </button>
      </div>

      {/* Trạng thái rỗng */}
      {questions.length === 0 && (
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 8,
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--muted)',
            background: 'var(--surface-2)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❓</div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)' }}>
            Chưa có câu hỏi nào trong bài quiz này
          </div>
          <p style={{ margin: '0.35rem 0 1rem 0', fontSize: '0.82rem' }}>
            Bấm nút bên dưới để bắt đầu tạo câu hỏi trắc nghiệm củng cố kiến thức.
          </p>
          <button type="button" onClick={addQuestion} className="btn btn-primary btn-sm">
            ➕ Thêm câu hỏi đầu tiên
          </button>
        </div>
      )}

      {/* Danh sách từng câu hỏi */}
      {questions.map((q, qIndex) => {
        const correctCount = q.answers.filter((a) => a.isCorrect).length;
        const hasNoCorrect = correctCount === 0;
        const hasEmptyContent = !q.content.trim();
        const hasEmptyAnswers = q.answers.some((a) => !a.content.trim());
        const isMulti = q.type === 'MULTIPLE_CHOICE';
        const isTrueFalse = q.type === 'TRUE_FALSE';

        return (
          <div
            key={qIndex}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface)',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {/* Header câu hỏi */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.85rem',
                background: 'var(--surface-2)',
                borderBottom: '1px solid var(--border)',
                flexWrap: 'wrap',
              }}
            >
              {/* Thứ tự & di chuyển */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => moveQuestion(qIndex, -1)}
                  disabled={qIndex === 0}
                  title="Di chuyển câu hỏi lên trên"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    width: 26,
                    height: 26,
                    cursor: qIndex === 0 ? 'not-allowed' : 'pointer',
                    background: 'var(--surface)',
                    opacity: qIndex === 0 ? 0.35 : 1,
                    fontSize: '0.8rem',
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(qIndex, 1)}
                  disabled={qIndex === questions.length - 1}
                  title="Di chuyển câu hỏi xuống dưới"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    width: 26,
                    height: 26,
                    cursor: qIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                    background: 'var(--surface)',
                    opacity: qIndex === questions.length - 1 ? 0.35 : 1,
                    fontSize: '0.8rem',
                  }}
                >
                  ↓
                </button>
              </div>

              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--brand-600)', minWidth: 60 }}>
                Câu {qIndex + 1}
              </span>

              {/* Loại câu hỏi */}
              <select
                className="input"
                value={q.type}
                onChange={(e) => updateQuestion(qIndex, { type: e.target.value as QuestionType })}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', height: 30, maxWidth: 220 }}
              >
                <option value="SINGLE_CHOICE">🔘 1 lựa chọn đúng (Single)</option>
                <option value="MULTIPLE_CHOICE">☑️ Nhiều lựa chọn đúng (Multi)</option>
                <option value="TRUE_FALSE">⚖️ Đúng / Sai (True/False)</option>
              </select>

              {/* Điểm số */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Điểm:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="input"
                  value={q.points ?? 1}
                  onChange={(e) => updateQuestion(qIndex, { points: Math.max(1, Number(e.target.value) || 1) })}
                  style={{ width: 55, height: 30, fontSize: '0.82rem', textAlign: 'center', padding: '0.2rem' }}
                />
              </div>

              {/* Hành động: Nhân bản / Xóa */}
              <button
                type="button"
                onClick={() => duplicateQuestion(qIndex)}
                title="Nhân bản câu hỏi này"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '0.2rem 0.5rem',
                  background: 'var(--surface)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                📋 Sao chép
              </button>

              <button
                type="button"
                onClick={() => deleteQuestion(qIndex)}
                title="Xóa câu hỏi này"
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '0.2rem 0.5rem',
                  background: 'var(--surface)',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                🗑️ Xóa
              </button>
            </div>

            {/* Nội dung câu hỏi & Đáp án */}
            <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Nội dung câu hỏi */}
              <div>
                <label className="label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                  Nội dung câu hỏi <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Ví dụ: Ai là người lãnh đạo cuộc khởi nghĩa Lam Sơn thắng lợi vào thế kỷ XV?"
                  value={q.content}
                  onChange={(e) => updateQuestion(qIndex, { content: e.target.value })}
                  style={{ fontSize: '0.88rem', resize: 'vertical' }}
                />
              </div>

              {/* Danh sách các đáp án */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.4rem',
                  }}
                >
                  <label className="label" style={{ fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>
                    Đáp án lựa chọn ({q.answers.length} đáp án)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: isMulti ? 'var(--brand-600)' : 'var(--muted)' }}>
                    {isMulti ? '☑️ Đánh dấu một hoặc nhiều đáp án đúng' : '🔘 Đánh dấu đúng 1 đáp án chính xác'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {q.answers.map((ans, aIndex) => (
                    <div
                      key={aIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0.6rem',
                        borderRadius: 6,
                        border: ans.isCorrect ? '1px solid #16a34a' : '1px solid var(--border)',
                        background: ans.isCorrect ? 'rgb(22 163 74 / 0.05)' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={`q-${qIndex}-ans`}
                        checked={ans.isCorrect}
                        onChange={(e) => updateAnswer(qIndex, aIndex, { isCorrect: e.target.checked })}
                        title={ans.isCorrect ? 'Đáp án đúng' : 'Đánh dấu là đáp án đúng'}
                        style={{ accentColor: '#16a34a', width: 17, height: 17, cursor: 'pointer' }}
                      />

                      <input
                        className="input"
                        placeholder={`Nội dung đáp án ${String.fromCharCode(65 + aIndex)}...`}
                        value={ans.content}
                        disabled={isTrueFalse}
                        onChange={(e) => updateAnswer(qIndex, aIndex, { content: e.target.value })}
                        style={{
                          flex: 1,
                          fontSize: '0.85rem',
                          height: 34,
                          fontWeight: ans.isCorrect ? 600 : 400,
                        }}
                      />

                      {!isTrueFalse && (
                        <button
                          type="button"
                          onClick={() => removeAnswer(qIndex, aIndex)}
                          disabled={q.answers.length <= 2}
                          title={q.answers.length <= 2 ? 'Tối thiểu 2 đáp án' : 'Xóa đáp án này'}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            width: 26,
                            height: 26,
                            cursor: q.answers.length <= 2 ? 'not-allowed' : 'pointer',
                            background: 'none',
                            color: '#dc2626',
                            opacity: q.answers.length <= 2 ? 0.35 : 1,
                            fontSize: '0.78rem',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Nút thêm đáp án */}
                {!isTrueFalse && q.answers.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addAnswer(qIndex)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: 'var(--brand-600)' }}
                  >
                    + Thêm lựa chọn đáp án ({q.answers.length}/6)
                  </button>
                )}
              </div>

              {/* Giải thích đáp án */}
              <div>
                <label className="label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                  Giải thích chi tiết (Hiển thị sau khi học sinh làm bài)
                </label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Giải thích vì sao đáp án này đúng, đối chiếu tư liệu lịch sử hoặc SGK..."
                  value={q.explanation ?? ''}
                  onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value || null })}
                  style={{ fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              {/* Cảnh báo lỗi trực quan của câu hỏi */}
              {(hasNoCorrect || hasEmptyContent || hasEmptyAnswers) && (
                <div
                  style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: 4,
                    background: 'rgb(220 38 38 / 0.08)',
                    border: '1px solid rgb(220 38 38 / 0.25)',
                    color: '#dc2626',
                    fontSize: '0.76rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>⚠️</span>
                  <span>
                    {hasEmptyContent
                      ? 'Nội dung câu hỏi không được để trống.'
                      : hasNoCorrect
                        ? 'Cần đánh dấu ít nhất 1 đáp án đúng.'
                        : 'Các đáp án không được để trống nội dung.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Nút thêm câu hỏi ở cuối danh sách */}
      {questions.length > 0 && questions.length < 50 && (
        <button
          type="button"
          onClick={addQuestion}
          className="btn btn-ghost"
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 8,
            padding: '0.75rem',
            fontSize: '0.88rem',
            color: 'var(--brand-600)',
          }}
        >
          ➕ Thêm câu hỏi tiếp theo ({questions.length + 1}/50)
        </button>
      )}
    </div>
  );
}
