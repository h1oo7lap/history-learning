import { z } from 'zod';
import { Difficulty, MediaType, PublishStatus } from '../enums';
import { CONTENT } from '../constants';
import { PaginationSchema } from './common';

export const LessonMediaSchema = z.object({
  type: z.nativeEnum(MediaType),
  url: z.string().url(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  displayOrder: z.number().int().default(0),
});
export type LessonMediaDto = z.infer<typeof LessonMediaSchema>;

export const LessonCharacterRelSchema = z.object({
  characterId: z.string().min(1),
  role: z.string().max(100).optional().nullable(),
});
export type LessonCharacterRelDto = z.infer<typeof LessonCharacterRelSchema>;

export const CreateLessonSchema = z.object({
  title: z.string().min(CONTENT.LESSON_TITLE_MIN).max(CONTENT.LESSON_TITLE_MAX),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  summary: z.string().max(CONTENT.LESSON_SUMMARY_MAX).optional().nullable(),
  content: z.string(),
  thumbnail: z.string().url().optional().nullable(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.EASY),
  estimatedTime: z.number().int().min(CONTENT.ESTIMATED_TIME_MIN).max(CONTENT.ESTIMATED_TIME_MAX).default(10),
  displayOrder: z.number().int().default(0),
  status: z.nativeEnum(PublishStatus).default(PublishStatus.DRAFT),
  // Relations
  gradeIds: z.array(z.string()).default([]),
  topicIds: z.array(z.string()).default([]),
  periodIds: z.array(z.string()).default([]),
  characters: z.array(LessonCharacterRelSchema).default([]),
  eventIds: z.array(z.string()).default([]),
  media: z.array(LessonMediaSchema).default([]),
});
export type CreateLessonDto = z.infer<typeof CreateLessonSchema>;
export const UpdateLessonSchema = CreateLessonSchema.partial();
export type UpdateLessonDto = z.infer<typeof UpdateLessonSchema>;

export const LessonListQuerySchema = PaginationSchema.extend({
  gradeId: z.string().optional(),
  topicId: z.string().optional(),
  periodId: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  search: z.string().optional(),
  status: z.nativeEnum(PublishStatus).optional(),
});
export type LessonListQueryDto = z.infer<typeof LessonListQuerySchema>;
