import { z } from 'zod';
import { QuestionType, PublishStatus } from '../enums';
import { QUIZ } from '../constants';

export const AnswerSchema = z.object({
  content: z.string().min(1),
  isCorrect: z.boolean(),
  displayOrder: z.number().int().default(0),
});
export type AnswerDto = z.infer<typeof AnswerSchema>;

export const QuestionSchema = z.object({
  content: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  points: z.number().int().positive().default(1),
  explanation: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  answers: z.array(AnswerSchema).min(QUIZ.ANSWERS_MIN).max(QUIZ.ANSWERS_MAX),
});
export type QuestionDto = z.infer<typeof QuestionSchema>;

export const CreateQuizSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  timeLimit: z.number().int().positive().optional().nullable(),
  passScore: z.number().int().min(QUIZ.PASS_SCORE_MIN).max(QUIZ.PASS_SCORE_MAX).default(QUIZ.PASS_SCORE_DEFAULT),
  status: z.nativeEnum(PublishStatus).default(PublishStatus.DRAFT),
});
export type CreateQuizDto = z.infer<typeof CreateQuizSchema>;
export const UpdateQuizSchema = CreateQuizSchema.partial();
export type UpdateQuizDto = z.infer<typeof UpdateQuizSchema>;

export const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answerIds: z.array(z.string()).min(1),
});
export type SubmitAnswerDto = z.infer<typeof SubmitAnswerSchema>;

export const SubmitQuizSchema = z.object({
  attemptId: z.string().optional(),
  answers: z.array(SubmitAnswerSchema),
});
export type SubmitQuizDto = z.infer<typeof SubmitQuizSchema>;
