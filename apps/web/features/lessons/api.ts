import { api } from '@/lib/api-client';
import type { ContentJsonDto } from '@history-learning/shared';

// ─── Types ─────────────────────────────────────────────────────

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface PublicLessonSummary {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  thumbnail: string | null;
  difficulty: Difficulty;
  estimatedTime: number;
  displayOrder: number;
  status: LessonStatus;
  grades: { gradeId: string; grade: { id: string; name: string; code: string } }[];
  topics: { topicId: string; topic: { id: string; name: string; slug: string } }[];
  periods: { periodId: string; period: { id: string; name: string; slug: string } }[];
}

export interface PublicLessonDetail extends PublicLessonSummary {
  content: string;
  contentJson: ContentJsonDto | null;
  characters: {
    characterId: string;
    role: string | null;
    character: { id: string; name: string; slug: string };
  }[];
  events: {
    eventId: string;
    event: { id: string; name: string; slug: string };
  }[];
  media: {
    id: string;
    type: string;
    url: string;
    title: string | null;
    description: string | null;
    displayOrder: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicLessonListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  gradeId?: string;
  topicId?: string;
  periodId?: string;
  difficulty?: Difficulty;
}

export interface PaginatedLessons {
  items: PublicLessonSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Public Lessons API ─────────────────────────────────────────

export const lessonsPublicApi = {
  /** List published lessons — no auth required. */
  list: (q: PublicLessonListQuery = {}) =>
    api.get<PaginatedLessons>('lessons', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.gradeId && { gradeId: q.gradeId }),
      ...(q.topicId && { topicId: q.topicId }),
      ...(q.periodId && { periodId: q.periodId }),
      ...(q.difficulty && { difficulty: q.difficulty }),
    }),

  /** Get a single published lesson by slug — no auth required. */
  getBySlug: (slug: string) => api.get<PublicLessonDetail>(`lessons/${slug}`),
};
