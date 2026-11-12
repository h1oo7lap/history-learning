'use client';

import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from './api';

export const leaderboardKeys = {
  all: ['leaderboard'] as const,
  byGrade: (gradeId?: string) => ['leaderboard', { gradeId }] as const,
};

export function useLeaderboard(gradeId?: string) {
  return useQuery({
    queryKey: leaderboardKeys.byGrade(gradeId),
    queryFn: () => leaderboardApi.getLeaderboard(gradeId),
    staleTime: 30 * 1000,
  });
}

