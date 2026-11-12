import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaderboardController } from './leaderboard.controller';
import type { GamificationService } from './gamification.service';
import type { User } from '../generated/prisma/client';

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  let mockGamificationService: {
    getLeaderboard: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockGamificationService = {
      getLeaderboard: vi.fn(),
    };
    controller = new LeaderboardController(
      mockGamificationService as unknown as GamificationService,
    );
  });

  it('delegates to gamificationService.getLeaderboard with gradeId and user id', async () => {
    const mockUser = { id: 'u-123' } as User;
    const mockResponse = {
      grade: { id: 'g-1', name: 'Lớp 6', code: 'GRADE_6' },
      totalParticipants: 10,
      top10: [],
      currentUser: null,
    };
    mockGamificationService.getLeaderboard.mockResolvedValue(mockResponse);

    const result = await controller.getLeaderboard(mockUser, { gradeId: 'g-1' });

    expect(mockGamificationService.getLeaderboard).toHaveBeenCalledWith('g-1', 'u-123');
    expect(result).toEqual(mockResponse);
  });

  it('handles optional user (guest)', async () => {
    const mockResponse = {
      grade: { id: 'g-1', name: 'Lớp 6', code: 'GRADE_6' },
      totalParticipants: 5,
      top10: [],
      currentUser: null,
    };
    mockGamificationService.getLeaderboard.mockResolvedValue(mockResponse);

    const result = await controller.getLeaderboard(undefined, {});

    expect(mockGamificationService.getLeaderboard).toHaveBeenCalledWith(undefined, undefined);
    expect(result).toEqual(mockResponse);
  });
});

