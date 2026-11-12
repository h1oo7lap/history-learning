import { api } from '@/lib/api-client';
import type { LeaderboardResponseDto } from '@history-learning/shared';

export const leaderboardApi = {
  getLeaderboard: (gradeId?: string) =>
    api.get<LeaderboardResponseDto>('leaderboard', { gradeId }),
};

