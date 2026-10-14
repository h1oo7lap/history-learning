import { api } from '@/lib/api-client';

// ─── Types ─────────────────────────────────────────────────────

export type PublishStatus = 'ACTIVE' | 'INACTIVE';
export type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  startYear: number | null;
  endYear: number | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  shortDescription: string | null;
  biography: string | null;
  birthYear: number | null;
  deathYear: number | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricalEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Lesson types ──────────────────────────────────────────────

export interface LessonGradeRel {
  gradeId: string;
  grade: { id: string; name: string; code: string };
}

export interface LessonTopicRel {
  topicId: string;
  topic: { id: string; name: string; slug: string };
}

export interface LessonPeriodRel {
  periodId: string;
  period: { id: string; name: string; slug: string };
}

export interface LessonCharacterRel {
  characterId: string;
  role: string | null;
  character: { id: string; name: string; slug: string };
}

export interface LessonEventRel {
  eventId: string;
  event: { id: string; name: string; slug: string };
}

export interface LessonMedia {
  id: string;
  type: MediaType;
  url: string;
  title: string | null;
  description: string | null;
  displayOrder: number;
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  thumbnail: string | null;
  difficulty: Difficulty;
  estimatedTime: number;
  displayOrder: number;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
  grades: LessonGradeRel[];
  topics: LessonTopicRel[];
  periods: LessonPeriodRel[];
  characters: LessonCharacterRel[];
  events: LessonEventRel[];
  media: LessonMedia[];
  contentJson?: { version: number; blocks: unknown[] } | null;
}

export interface CreateLessonPayload {
  title: string;
  slug?: string;
  summary?: string | null;
  content: string;
  contentJson?: { version: number; blocks: unknown[] } | null;
  thumbnail?: string | null;
  difficulty?: Difficulty;
  estimatedTime?: number;
  displayOrder?: number;
  status?: LessonStatus;
  gradeIds?: string[];
  topicIds?: string[];
  periodIds?: string[];
  characters?: { characterId: string; role?: string | null }[];
  eventIds?: string[];
  media?: {
    type: MediaType;
    url: string;
    title?: string | null;
    description?: string | null;
    displayOrder?: number;
  }[];
}

export type UpdateLessonPayload = Partial<CreateLessonPayload>;

// ─── Relation option types (for form dropdowns) ────────────────

export interface GradeOption {
  id: string;
  name: string;
  code: string;
}

export interface TaxonomyOption {
  id: string;
  name: string;
  slug: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  totalExp?: number;
  gradeId?: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PublishStatus | '';
}

export interface LessonListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LessonStatus | '';
  gradeId?: string;
  topicId?: string;
  periodId?: string;
  difficulty?: Difficulty | '';
}

// ─── Topics API ────────────────────────────────────────────────

export const topicsAdminApi = {
  list: (q: AdminListQuery = {}) =>
    api.get<PaginatedResult<Topic>>('admin/topics', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<Topic>(`admin/topics/${id}`),

  create: (dto: { name: string; slug?: string; description?: string; status?: PublishStatus }) =>
    api.post<Topic>('admin/topics', dto),

  update: (
    id: string,
    dto: { name?: string; slug?: string; description?: string; status?: PublishStatus },
  ) => api.patch<Topic>(`admin/topics/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/topics/${id}`),
};

// ─── Periods API ───────────────────────────────────────────────

export const periodsAdminApi = {
  list: (q: AdminListQuery = {}) =>
    api.get<PaginatedResult<Period>>('admin/periods', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<Period>(`admin/periods/${id}`),

  create: (dto: {
    name: string;
    slug?: string;
    description?: string;
    startYear?: number | null;
    endYear?: number | null;
    status?: PublishStatus;
  }) => api.post<Period>('admin/periods', dto),

  update: (
    id: string,
    dto: {
      name?: string;
      slug?: string;
      description?: string;
      startYear?: number | null;
      endYear?: number | null;
      status?: PublishStatus;
    },
  ) => api.patch<Period>(`admin/periods/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/periods/${id}`),
};

// ─── Characters API ────────────────────────────────────────────

export const charactersAdminApi = {
  list: (q: AdminListQuery = {}) =>
    api.get<PaginatedResult<Character>>('admin/characters', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<Character>(`admin/characters/${id}`),

  create: (dto: {
    name: string;
    slug?: string;
    shortDescription?: string;
    biography?: string;
    birthYear?: number | null;
    deathYear?: number | null;
    avatar?: string | null;
    status?: PublishStatus;
  }) => api.post<Character>('admin/characters', dto),

  update: (
    id: string,
    dto: {
      name?: string;
      slug?: string;
      shortDescription?: string;
      biography?: string;
      birthYear?: number | null;
      deathYear?: number | null;
      avatar?: string | null;
      status?: PublishStatus;
    },
  ) => api.patch<Character>(`admin/characters/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/characters/${id}`),
};

// ─── Events API ────────────────────────────────────────────────

export const eventsAdminApi = {
  list: (q: AdminListQuery = {}) =>
    api.get<PaginatedResult<HistoricalEvent>>('admin/events', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<HistoricalEvent>(`admin/events/${id}`),

  create: (dto: {
    name: string;
    slug?: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
    location?: string | null;
    status?: PublishStatus;
  }) => api.post<HistoricalEvent>('admin/events', dto),

  update: (
    id: string,
    dto: {
      name?: string;
      slug?: string;
      description?: string;
      startDate?: string | null;
      endDate?: string | null;
      location?: string | null;
      status?: PublishStatus;
    },
  ) => api.patch<HistoricalEvent>(`admin/events/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/events/${id}`),
};

// ─── Lessons API ───────────────────────────────────────────────

export const lessonsAdminApi = {
  list: (q: LessonListQuery = {}) =>
    api.get<PaginatedResult<Lesson>>('admin/lessons', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
      ...(q.gradeId && { gradeId: q.gradeId }),
      ...(q.topicId && { topicId: q.topicId }),
      ...(q.periodId && { periodId: q.periodId }),
      ...(q.difficulty && { difficulty: q.difficulty }),
    }),

  getOne: (id: string) => api.get<Lesson>(`admin/lessons/${id}`),

  create: (dto: CreateLessonPayload) => api.post<Lesson>('admin/lessons', dto),

  update: (id: string, dto: UpdateLessonPayload) => api.patch<Lesson>(`admin/lessons/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/lessons/${id}`),
};

// ─── Relation lookup APIs (for lesson form dropdowns) ──────────

export const relationLookupApi = {
  grades: () => api.get<GradeOption[]>('grades'),
  topics: (q?: { pageSize?: number }) =>
    api.get<PaginatedResult<TaxonomyOption>>('admin/topics', { pageSize: q?.pageSize ?? 100 }),
  periods: (q?: { pageSize?: number }) =>
    api.get<PaginatedResult<TaxonomyOption>>('admin/periods', { pageSize: q?.pageSize ?? 100 }),
  characters: (q?: { pageSize?: number }) =>
    api.get<PaginatedResult<TaxonomyOption>>('admin/characters', { pageSize: q?.pageSize ?? 100 }),
  events: (q?: { pageSize?: number }) =>
    api.get<PaginatedResult<TaxonomyOption>>('admin/events', { pageSize: q?.pageSize ?? 100 }),
};

// ─── Admin Users API ───────────────────────────────────────────

export const usersAdminApi = {
  list: () => api.get<AdminUser[]>('admin/users'),

  getOne: (id: string) => api.get<AdminUser>(`admin/users/${id}`),

  update: (id: string, dto: { status?: UserStatus; role?: UserRole }) =>
    api.patch<AdminUser>(`admin/users/${id}`, dto),
};

// ─── Quiz types ────────────────────────────────────────────────

export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface AdminAnswer {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface AdminQuestion {
  id: string;
  quizId: string;
  content: string;
  type: QuestionType;
  points: number;
  explanation: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  answers: AdminAnswer[];
}

export interface AdminQuizLesson {
  id: string;
  title: string;
  slug: string;
}

export interface AdminQuiz {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passScore: number;
  status: QuizStatus;
  createdAt: string;
  updatedAt: string;
  lesson: AdminQuizLesson;
  questions: AdminQuestion[];
  _count?: { questions: number };
}

export interface CreateQuizPayload {
  lessonId: string;
  title: string;
  description?: string | null;
  timeLimit?: number | null;
  passScore?: number;
  status?: QuizStatus;
}

export type UpdateQuizPayload = Partial<Omit<CreateQuizPayload, 'lessonId'>>;

export interface QuizListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: QuizStatus | '';
}

export interface AnswerPayload {
  content: string;
  isCorrect: boolean;
  displayOrder?: number;
}

export interface QuestionPayload {
  content: string;
  type: QuestionType;
  points?: number;
  explanation?: string | null;
  displayOrder?: number;
  answers: AnswerPayload[];
}

// ─── Quizzes API ───────────────────────────────────────────────

export const quizzesAdminApi = {
  list: (q: QuizListQuery = {}) =>
    api.get<PaginatedResult<AdminQuiz>>('admin/quizzes', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<AdminQuiz>(`admin/quizzes/${id}`),

  create: (dto: CreateQuizPayload) => api.post<AdminQuiz>('admin/quizzes', dto),

  update: (id: string, dto: UpdateQuizPayload) => api.patch<AdminQuiz>(`admin/quizzes/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/quizzes/${id}`),

  setQuestions: (id: string, questions: QuestionPayload[]) =>
    api.put<AdminQuiz>(`admin/quizzes/${id}/questions`, { questions }),
};
