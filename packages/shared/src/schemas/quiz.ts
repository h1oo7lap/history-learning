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
  passScore: z
    .number()
    .int()
    .min(QUIZ.PASS_SCORE_MIN)
    .max(QUIZ.PASS_SCORE_MAX)
    .default(QUIZ.PASS_SCORE_DEFAULT),
  status: z.nativeEnum(PublishStatus).default(PublishStatus.DRAFT),
});
export type CreateQuizDto = z.input<typeof CreateQuizSchema>;
export const UpdateQuizSchema = CreateQuizSchema.partial();

export type UpdateQuizDto = z.infer<typeof UpdateQuizSchema>;

export const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1),
  answerIds: z.array(z.string().min(1)).min(1),
});
export type SubmitAnswerDto = z.infer<typeof SubmitAnswerSchema>;

export const SubmitQuizSchema = z
  .object({
    attemptId: z.string().min(1, 'attemptId là bắt buộc'),
    answers: z.array(SubmitAnswerSchema),
  })
  .refine(
    (data) => {
      const questionIds = new Set<string>();
      for (const ans of data.answers) {
        if (questionIds.has(ans.questionId)) return false;
        questionIds.add(ans.questionId);
        const answerIds = new Set<string>();
        for (const aId of ans.answerIds) {
          if (answerIds.has(aId)) return false;
          answerIds.add(aId);
        }
      }
      return true;
    },
    {
      message: 'Không được có câu hỏi trùng lặp hoặc đáp án trùng lặp trong một câu',
    },
  );
export type SubmitQuizDto = z.infer<typeof SubmitQuizSchema>;

// ---- Student Quiz Schemas ----
export const AttemptIdParamSchema = z.object({
  attemptId: z.string().trim().min(1, 'Attempt ID không được để trống'),
});
export type AttemptIdParamDto = z.infer<typeof AttemptIdParamSchema>;

export const StudentQuizListQuerySchema = z.object({
  gradeId: z.string().optional(),
});
export type StudentQuizListQueryDto = z.infer<typeof StudentQuizListQuerySchema>;

export const StudentQuizItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  timeLimit: z.number().nullable(),
  questionCount: z.number(),
  lessonId: z.string(),
  lesson: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
  }),
  status: z.enum(['LOCKED', 'AVAILABLE', 'DONE']),
  lastAttempt: z
    .object({
      score: z.number(),
      totalScore: z.number(),
      passed: z.boolean(),
    })
    .nullable(),
});
export type StudentQuizItemDto = z.infer<typeof StudentQuizItemSchema>;

export const StartQuizAnswerSchema = z.object({
  id: z.string(),
  content: z.string(),
  displayOrder: z.number(),
});
export type StartQuizAnswerDto = z.infer<typeof StartQuizAnswerSchema>;

export const StartQuizQuestionSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.nativeEnum(QuestionType),
  points: z.number(),
  displayOrder: z.number(),
  answers: z.array(StartQuizAnswerSchema),
});
export type StartQuizQuestionDto = z.infer<typeof StartQuizQuestionSchema>;

export const StartQuizResponseSchema = z.object({
  attemptId: z.string(),
  startedAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
  serverTime: z.coerce.date(),
  timeLimit: z.number().nullable(),
  questions: z.array(StartQuizQuestionSchema),
});
export type StartQuizResponseDto = z.infer<typeof StartQuizResponseSchema>;

export const QuizSubmitResponseSchema = z.object({
  attemptId: z.string(),
  score: z.number(),
  totalScore: z.number(),
  correctAnswers: z.number(),
  totalQuestions: z.number(),
  passed: z.boolean(),
  submittedAt: z.coerce.date(),
});
export type QuizSubmitResponseDto = z.infer<typeof QuizSubmitResponseSchema>;

export const QuizAttemptReviewAnswerSchema = z.object({
  id: z.string(),
  content: z.string(),
  isCorrect: z.boolean(),
  displayOrder: z.number(),
});
export type QuizAttemptReviewAnswerDto = z.infer<typeof QuizAttemptReviewAnswerSchema>;

export const QuizAttemptReviewQuestionSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.nativeEnum(QuestionType),
  points: z.number(),
  explanation: z.string().nullable(),
  displayOrder: z.number(),
  answers: z.array(QuizAttemptReviewAnswerSchema),
  selectedAnswerIds: z.array(z.string()),
  isUserCorrect: z.boolean(),
});
export type QuizAttemptReviewQuestionDto = z.infer<typeof QuizAttemptReviewQuestionSchema>;

export const QuizAttemptReviewSchema = z.object({
  attempt: z.object({
    id: z.string(),
    quizId: z.string(),
    score: z.number(),
    totalScore: z.number(),
    correctAnswers: z.number(),
    totalQuestions: z.number(),
    passed: z.boolean(),
    startedAt: z.coerce.date(),
    submittedAt: z.coerce.date(),
  }),
  quiz: z.object({
    id: z.string(),
    title: z.string(),
    passScore: z.number(),
    timeLimit: z.number().nullable(),
    lesson: z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
    }),
  }),
  questions: z.array(QuizAttemptReviewQuestionSchema),
});
export type QuizAttemptReviewDto = z.infer<typeof QuizAttemptReviewSchema>;
