'use client';

import { useQuery } from '@tanstack/react-query';
import { lessonsPublicApi, type PublicLessonListQuery } from './api';

export function usePublicLesson(slug: string) {
  return useQuery({
    queryKey: ['lessons', 'public', slug],
    queryFn: () => lessonsPublicApi.getBySlug(slug),
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });
}

export function usePublicLessons(query: PublicLessonListQuery = {}) {
  return useQuery({
    queryKey: ['lessons', 'public', 'list', query],
    queryFn: () => lessonsPublicApi.list(query),
    staleTime: 2 * 60 * 1000,
  });
}
