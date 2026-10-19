'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizzesApi } from './api';
import type { SubmitQuizDto } from './api';
import { useIsAuthenticated } from '@/features/auth/hooks';

// ─── Query keys ──────────────────────────────────────────────
export const quizzesKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizzesKeys.all, 'list'] as const,
  list: (gradeId?: string) => [...quizzesKeys.lists(), { gradeId }] as const,
  reviews: () => [...quizzesKeys.all, 'review'] as const,
  review: (attemptId: string) => [...quizzesKeys.reviews(), attemptId] as const,
};

// ─── Danh sách quiz học sinh (Q13) ────────────────────────────
export function useQuizzes(gradeId?: string) {
  const { isAuthenticated } = useIsAuthenticated();

  return useQuery({
    queryKey: quizzesKeys.list(gradeId),
    queryFn: () => quizzesApi.getQuizzes(gradeId),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

// ─── Bắt đầu lượt làm bài mới hoặc dùng lại lượt chưa nộp (Q3) ──
export function useStartQuiz() {
  return useMutation({
    mutationFn: (quizId: string) => quizzesApi.startQuiz(quizId),
  });
}

// ─── Nộp bài làm chấm điểm trên server (Q4, Q5, Q6) ───────────
export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, dto }: { quizId: string; dto: SubmitQuizDto }) =>
      quizzesApi.submitQuiz(quizId, dto),
    onSuccess: () => {
      // Làm mới danh sách quiz để cập nhật trạng thái DONE và điểm số mới
      queryClient.invalidateQueries({ queryKey: quizzesKeys.lists() });
    },
  });
}

// ─── Xem kết quả và review đáp án sau khi nộp (Q10) ───────────
export function useAttemptReview(attemptId: string) {
  const { isAuthenticated } = useIsAuthenticated();

  return useQuery({
    queryKey: quizzesKeys.review(attemptId),
    queryFn: () => quizzesApi.getAttemptReview(attemptId),
    enabled: isAuthenticated && Boolean(attemptId),
    staleTime: 5 * 60 * 1000,
  });
}
