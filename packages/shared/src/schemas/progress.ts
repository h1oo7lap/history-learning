import { z } from 'zod';
import { ProgressStatus } from '../enums';

export const LessonProgressItemSchema = z.object({
  lessonId: z.string(),
  status: z.nativeEnum(ProgressStatus),
  progress: z.number().int().min(0).max(100),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
});
export type LessonProgressItemDto = z.infer<typeof LessonProgressItemSchema>;

export const LessonProgressResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lessonId: z.string(),
  status: z.nativeEnum(ProgressStatus),
  progress: z.number().int().min(0).max(100),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type LessonProgressResponseDto = z.infer<typeof LessonProgressResponseSchema>;

export const MyProgressListResponseSchema = z.array(LessonProgressItemSchema);
export type MyProgressListResponseDto = z.infer<typeof MyProgressListResponseSchema>;
