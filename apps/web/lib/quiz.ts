import { QuestionType } from '@history-learning/shared';

/**
 * Tính số giây còn lại dựa trên expiresAt và độ lệch thời gian máy chủ.
 * @param expiresAt Mốc thời gian hết hạn (ISO string hoặc Date object)
 * @param serverOffsetMs Độ lệch thời gian giữa server và client (serverTime - clientTime)
 * @returns Số giây còn lại (>= 0), hoặc null nếu bài làm không giới hạn thời gian
 */
export function calculateRemainingSeconds(
  expiresAt: Date | string | null | undefined,
  serverOffsetMs: number = 0
): number | null {
  if (!expiresAt) return null;

  const expiryTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryTime)) return null;

  const currentServerTime = Date.now() + serverOffsetMs;
  const diffMs = expiryTime - currentServerTime;

  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Định dạng số giây thành chuỗi đếm ngược mm:ss (hoặc hh:mm:ss nếu > 1 giờ).
 */
export function formatCountdown(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) {
    return 'Không giới hạn';
  }

  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * Định dạng thời lượng làm bài cho nhãn hiển thị (ví dụ: "15 phút", "45 giây").
 */
export function formatTimeLimit(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) {
    return 'Không giới hạn';
  }

  if (seconds < 60) {
    return `${seconds} giây`;
  }

  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;

  if (remSecs === 0) {
    return `${mins} phút`;
  }
  return `${mins} phút ${remSecs} giây`;
}

/**
 * Cập nhật danh sách đáp án đã chọn theo loại câu hỏi (Q7).
 * - SINGLE_CHOICE / TRUE_FALSE: chọn đúng 1 đáp án (thay thế).
 * - MULTIPLE_CHOICE: chọn/bỏ chọn nhiều đáp án.
 */
export function toggleAnswer(
  currentSelected: string[] | undefined,
  answerId: string,
  questionType: QuestionType | string
): string[] {
  const selected = currentSelected ?? [];

  if (
    questionType === QuestionType.SINGLE_CHOICE ||
    questionType === QuestionType.TRUE_FALSE
  ) {
    return [answerId];
  }

  if (questionType === QuestionType.MULTIPLE_CHOICE) {
    if (selected.includes(answerId)) {
      return selected.filter((id) => id !== answerId);
    }
    return [...selected, answerId];
  }

  return [answerId];
}

/**
 * Kiểm tra xem đáp án có đang được chọn hay không.
 */
export function isAnswerSelected(
  selectedAnswerIds: string[] | undefined,
  answerId: string
): boolean {
  return Boolean(selectedAnswerIds?.includes(answerId));
}

/**
 * Thống kê số lượng câu hỏi đã trả lời và chưa trả lời (Q8).
 */
export function countAnsweredQuestions(
  questionIds: string[],
  answers: Record<string, string[]>
): { answered: number; total: number; unanswered: number } {
  const total = questionIds.length;
  const answered = questionIds.filter((id) => (answers[id]?.length ?? 0) > 0).length;
  const unanswered = Math.max(0, total - answered);

  return { answered, total, unanswered };
}

// ─── Quản lý bản nháp đáp án trong sessionStorage ──────────────────────────

const DRAFT_PREFIX = 'hl_quiz_draft_';

export function getDraftStorageKey(attemptId: string): string {
  return `${DRAFT_PREFIX}${attemptId}`;
}

/**
 * Lưu đáp án tạm vào sessionStorage an toàn trong try/catch.
 */
export function saveDraftAnswers(
  attemptId: string,
  answers: Record<string, string[]>
): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(
        getDraftStorageKey(attemptId),
        JSON.stringify(answers)
      );
    }
  } catch {
    // Tránh crash nếu sessionStorage đầy hoặc bị chặn
  }
}

/**
 * Đọc đáp án tạm từ sessionStorage theo attemptId.
 * Điều chỉnh 1: Lọc bỏ questionId / answerId không còn trong đề thi hiện tại.
 */
export function loadDraftAnswers(
  attemptId: string,
  validQuestionMap?: Map<string, Set<string>>
): Record<string, string[]> {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return {};
    }

    const raw = window.sessionStorage.getItem(getDraftStorageKey(attemptId));
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    if (!validQuestionMap) {
      return parsed as Record<string, string[]>;
    }

    // Lọc lại các câu hỏi/đáp án còn tồn tại trong đề
    const sanitized: Record<string, string[]> = {};
    for (const [qId, ansIds] of Object.entries(parsed)) {
      const validAnsSet = validQuestionMap.get(qId);
      if (validAnsSet && Array.isArray(ansIds)) {
        const filtered = ansIds.filter(
          (aId): aId is string => typeof aId === 'string' && validAnsSet.has(aId)
        );
        if (filtered.length > 0) {
          sanitized[qId] = filtered;
        }
      }
    }

    return sanitized;
  } catch {
    return {};
  }
}

/**
 * Xóa bản nháp đáp án khỏi sessionStorage sau khi nộp hoặc khi hết giờ quá hạn.
 */
export function clearDraftAnswers(attemptId: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(getDraftStorageKey(attemptId));
    }
  } catch {
    // Bỏ qua lỗi truy cập storage
  }
}
