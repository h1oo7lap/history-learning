import { api } from '@/lib/api-client';
import type {
  StudentQuizItemDto,
  StartQuizResponseDto,
  SubmitQuizDto,
  SubmitAnswerDto,
  QuizSubmitResponseDto,
  QuizAttemptReviewDto,
  QuizAttemptReviewQuestionDto,
} from '@history-learning/shared';

export type {
  StudentQuizItemDto,
  StartQuizResponseDto,
  SubmitQuizDto,
  SubmitAnswerDto,
  QuizSubmitResponseDto,
  QuizAttemptReviewDto,
  QuizAttemptReviewQuestionDto,
};

export const quizzesApi = {
  /** Lấy danh sách quiz cho học sinh kèm trạng thái LOCKED, AVAILABLE, DONE (Q13) */
  getQuizzes: (gradeId?: string) =>
    api.get<StudentQuizItemDto[]>('quizzes', { gradeId }),

  /** Bắt đầu hoặc tái sử dụng attempt đang mở chưa hết hạn (Q3) */
  startQuiz: (quizId: string) =>
    api.post<StartQuizResponseDto>(`quizzes/${quizId}/start`),

  /** Nộp bài làm chấm điểm trên server (Q4, Q5, Q6) */
  submitQuiz: (quizId: string, dto: SubmitQuizDto) =>
    api.post<QuizSubmitResponseDto>(`quizzes/${quizId}/submit`, dto),

  /** Xem lại kết quả và đáp án chi tiết sau khi nộp (Q10) */
  getAttemptReview: (attemptId: string) =>
    api.get<QuizAttemptReviewDto>(`quizzes/attempts/${attemptId}`),
};
