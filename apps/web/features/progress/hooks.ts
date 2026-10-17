'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { progressApi } from './api';
import { ApiClientError } from '@/lib/api-client';
import { useIsAuthenticated } from '@/features/auth/hooks';

// ─── Query keys ──────────────────────────────────────────────
export const progressKeys = {
  all: ['progress'] as const,
  me: ['progress', 'me'] as const,
};

// ─── Get current user's progress ──────────────────────────────
export function useMyProgress() {
  const { isAuthenticated } = useIsAuthenticated();

  return useQuery({
    queryKey: progressKeys.me,
    queryFn: () => progressApi.getMyProgress(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

// ─── Start a lesson (set IN_PROGRESS) ─────────────────────────
export function useStartLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => progressApi.startLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.me });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error('Không thể cập nhật trạng thái bài học.');
      }
    },
  });
}

// ─── Complete a lesson (set COMPLETED) ─────────────────────────
export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => progressApi.completeLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.me });
      toast.success('Đã hoàn thành bài học!');
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error('Không thể đánh dấu hoàn thành bài học.');
      }
    },
  });
}
