import { api } from '@/lib/api-client';
import type {
  LessonProgressResponseDto,
  LessonProgressItemDto,
} from '@history-learning/shared';

export { ProgressStatus } from '@history-learning/shared';
export type { LessonProgressResponseDto, LessonProgressItemDto };

export const progressApi = {
  /** Start a lesson — sets status to IN_PROGRESS. Authenticated. */
  startLesson: (lessonId: string) =>
    api.post<LessonProgressResponseDto>(`lessons/${lessonId}/start`),

  /** Mark a lesson as complete — sets status to COMPLETED. Authenticated. */
  completeLesson: (lessonId: string) =>
    api.post<LessonProgressResponseDto>(`lessons/${lessonId}/complete`),

  /** Get all lesson progress records for current user. Authenticated. */
  getMyProgress: () =>
    api.get<LessonProgressItemDto[]>('progress/me'),
};
