'use client';

import { useQuery } from '@tanstack/react-query';
import { collectionApi } from './api';
import { useIsAuthenticated } from '@/features/auth/hooks';

// ─── Query keys ──────────────────────────────────────────────
export const collectionKeys = {
  all: ['collection'] as const,
  me: ['collection', 'me'] as const,
};

// ─── Lấy bộ sưu tập của người dùng hiện tại ───────────────────
export function useMyCollection() {
  const { isAuthenticated } = useIsAuthenticated();

  return useQuery({
    queryKey: collectionKeys.me,
    queryFn: () => collectionApi.getMyCollection(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

