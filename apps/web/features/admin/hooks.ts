import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  topicsAdminApi,
  periodsAdminApi,
  charactersAdminApi,
  eventsAdminApi,
  lessonsAdminApi,
  usersAdminApi,
  quizzesAdminApi,
  relationLookupApi,
} from './api';
import type {
  AdminListQuery,
  LessonListQuery,
  PublishStatus,
  UserStatus,
  UserRole,
  CreateLessonPayload,
  UpdateLessonPayload,
  QuizListQuery,
  CreateQuizPayload,
  UpdateQuizPayload,
  QuestionPayload,
} from './api';

// ─── Topics hooks ──────────────────────────────────────────────

export const TOPICS_KEY = 'admin-topics';

export function useAdminTopics(query: AdminListQuery) {
  return useQuery({
    queryKey: [TOPICS_KEY, query],
    queryFn: () => topicsAdminApi.list(query),
  });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: topicsAdminApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TOPICS_KEY] }),
  });
}

export function useUpdateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; slug?: string; description?: string; status?: PublishStatus } }) =>
      topicsAdminApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TOPICS_KEY] }),
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => topicsAdminApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TOPICS_KEY] }),
  });
}

// ─── Periods hooks ─────────────────────────────────────────────

export const PERIODS_KEY = 'admin-periods';

export function useAdminPeriods(query: AdminListQuery) {
  return useQuery({
    queryKey: [PERIODS_KEY, query],
    queryFn: () => periodsAdminApi.list(query),
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: periodsAdminApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [PERIODS_KEY] }),
  });
}

export function useUpdatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: {
      id: string;
      dto: {
        name?: string;
        slug?: string;
        description?: string;
        startYear?: number | null;
        endYear?: number | null;
        status?: PublishStatus;
      };
    }) => periodsAdminApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PERIODS_KEY] }),
  });
}

export function useDeletePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => periodsAdminApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PERIODS_KEY] }),
  });
}

// ─── Characters hooks ──────────────────────────────────────────

export const CHARACTERS_KEY = 'admin-characters';

export function useAdminCharacters(query: AdminListQuery) {
  return useQuery({
    queryKey: [CHARACTERS_KEY, query],
    queryFn: () => charactersAdminApi.list(query),
  });
}

export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: charactersAdminApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHARACTERS_KEY] }),
  });
}

export function useUpdateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: {
      id: string;
      dto: {
        name?: string;
        slug?: string;
        shortDescription?: string;
        biography?: string;
        birthYear?: number | null;
        deathYear?: number | null;
        avatar?: string | null;
        status?: PublishStatus;
      };
    }) => charactersAdminApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHARACTERS_KEY] }),
  });
}

export function useDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => charactersAdminApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHARACTERS_KEY] }),
  });
}

// ─── Events hooks ──────────────────────────────────────────────

export const EVENTS_KEY = 'admin-events';

export function useAdminEvents(query: AdminListQuery) {
  return useQuery({
    queryKey: [EVENTS_KEY, query],
    queryFn: () => eventsAdminApi.list(query),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eventsAdminApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [EVENTS_KEY] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: {
      id: string;
      dto: {
        name?: string;
        slug?: string;
        description?: string;
        startDate?: string | null;
        endDate?: string | null;
        location?: string | null;
        status?: PublishStatus;
      };
    }) => eventsAdminApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EVENTS_KEY] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsAdminApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EVENTS_KEY] }),
  });
}

// ─── Lessons hooks ─────────────────────────────────────────────

export const LESSONS_KEY = 'admin-lessons';

export function useAdminLessons(query: LessonListQuery) {
  return useQuery({
    queryKey: [LESSONS_KEY, query],
    queryFn: () => lessonsAdminApi.list(query),
  });
}

export function useAdminLesson(id: string | null) {
  return useQuery({
    queryKey: [LESSONS_KEY, 'detail', id],
    queryFn: () => lessonsAdminApi.getOne(id!),
    enabled: !!id,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLessonPayload) => lessonsAdminApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LESSONS_KEY] }),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLessonPayload }) =>
      lessonsAdminApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LESSONS_KEY] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonsAdminApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LESSONS_KEY] }),
  });
}

// ─── Relation lookup hooks (for lesson form) ───────────────────

export function useGradeOptions() {
  return useQuery({
    queryKey: ['lookup-grades'],
    queryFn: () => relationLookupApi.grades(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useTopicOptions() {
  return useQuery({
    queryKey: ['lookup-topics'],
    queryFn: () => relationLookupApi.topics(),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.items,
  });
}

export function usePeriodOptions() {
  return useQuery({
    queryKey: ['lookup-periods'],
    queryFn: () => relationLookupApi.periods(),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.items,
  });
}

export function useCharacterOptions() {
  return useQuery({
    queryKey: ['lookup-characters'],
    queryFn: () => relationLookupApi.characters(),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.items,
  });
}

export function useEventOptions() {
  return useQuery({
    queryKey: ['lookup-events'],
    queryFn: () => relationLookupApi.events(),
    staleTime: 5 * 60 * 1000,
    select: (data) => data.items,
  });
}

// ─── Admin Users hooks ─────────────────────────────────────────

export const ADMIN_USERS_KEY = 'admin-users';

export function useAdminUsers() {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY],
    queryFn: () => usersAdminApi.list(),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { status?: UserStatus; role?: UserRole; gradeId?: string | null } }) =>
      usersAdminApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

// ─── Quizzes hooks ─────────────────────────────────────────────

export const QUIZZES_KEY = 'admin-quizzes';

export function useAdminQuizzes(query: QuizListQuery) {
  return useQuery({
    queryKey: [QUIZZES_KEY, query],
    queryFn: () => quizzesAdminApi.list(query),
  });
}

export function useAdminQuiz(id: string | null) {
  return useQuery({
    queryKey: [QUIZZES_KEY, 'detail', id],
    queryFn: () => quizzesAdminApi.getOne(id!),
    enabled: !!id,
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateQuizPayload) => quizzesAdminApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUIZZES_KEY] }),
  });
}

export function useUpdateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateQuizPayload }) =>
      quizzesAdminApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUIZZES_KEY] }),
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizzesAdminApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUIZZES_KEY] }),
  });
}

export function useSetQuizQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, questions }: { id: string; questions: QuestionPayload[] }) =>
      quizzesAdminApi.setQuestions(id, questions),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [QUIZZES_KEY] });
      qc.invalidateQueries({ queryKey: [QUIZZES_KEY, 'detail', vars.id] });
    },
  });
}
