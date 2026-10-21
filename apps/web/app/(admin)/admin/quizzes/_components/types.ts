import type { QuizStatus, QuestionPayload, AnswerPayload } from '@/features/admin/api';

export type QuizTabKey = 'basic' | 'settings' | 'questions';

export interface QuizTabItem {
  key: QuizTabKey;
  label: string;
  icon: string;
  badge?: number | string;
}

export type { QuizStatus, QuestionPayload, AnswerPayload };
