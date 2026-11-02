import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GamificationService } from './gamification.service';
import { EXP } from '../common/config/constants';

function createMockPrisma() {
  const levels = [
    { id: 'lvl-1', name: 'Tân sinh', requiredExp: 0, displayOrder: 1 },
    { id: 'lvl-2', name: 'Học trò', requiredExp: 100, displayOrder: 2 },
    { id: 'lvl-3', name: 'Học giả', requiredExp: 250, displayOrder: 3 },
    { id: 'lvl-4', name: 'Hiền tài', requiredExp: 500, displayOrder: 4 },
    { id: 'lvl-5', name: 'Sử gia', requiredExp: 1000, displayOrder: 5 },
  ];

  const tx = {
    expTransaction: {
      createMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    lessonCharacter: {
      findMany: vi.fn(),
    },
    lessonEvent: {
      findMany: vi.fn(),
    },
    userCharacter: {
      createMany: vi.fn(),
    },
    userEvent: {
      createMany: vi.fn(),
    },
    historicalCharacter: {
      findMany: vi.fn(),
    },
    historicalEvent: {
      findMany: vi.fn(),
    },
    level: {
      findMany: vi.fn().mockResolvedValue(levels),
    },
  };

  return {
    userCharacter: {
      findMany: vi.fn(),
    },
    userEvent: {
      findMany: vi.fn(),
    },
    level: {
      findMany: vi.fn().mockResolvedValue(levels),
    },
    $transaction: vi.fn(async (cb: (prismaTx: typeof tx) => Promise<any>) => cb(tx)),
    _tx: tx,
  } as any;
}

describe('GamificationService', () => {
  let service: GamificationService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const userId = 'user-test-1';
  const lessonId = 'lesson-bach-dang';
  const quizId = 'quiz-bach-dang';

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new GamificationService(mockPrisma);
  });

  // =========================================================================
  // Lesson Reward
  // =========================================================================
  describe('awardLessonReward', () => {
    it('grants +20 EXP, increments user.totalExp, and unlocks lesson characters & events on first completion', async () => {
      const tx = mockPrisma._tx;

      // First completion: createMany succeeds with count 1
      tx.expTransaction.createMany.mockResolvedValue({ count: 1 });
      tx.user.update.mockResolvedValue({ totalExp: 20 });

      // Lesson has 1 character and 1 event
      tx.lessonCharacter.findMany.mockResolvedValue([{ characterId: 'char-ngo-quyen' }]);
      tx.lessonEvent.findMany.mockResolvedValue([{ eventId: 'event-bach-dang-938' }]);

      tx.userCharacter.createMany.mockResolvedValue({ count: 1 });
      tx.userEvent.createMany.mockResolvedValue({ count: 1 });

      tx.historicalCharacter.findMany.mockResolvedValue([
        { id: 'char-ngo-quyen', name: 'Ngô Quyền', slug: 'ngo-quyen' },
      ]);
      tx.historicalEvent.findMany.mockResolvedValue([
        { id: 'event-bach-dang-938', name: 'Chiến thắng Bạch Đằng', slug: 'chien-thang-bach-dang-938' },
      ]);

      const result = await service.awardLessonReward(tx, userId, lessonId);

      expect(tx.expTransaction.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId,
            type: 'LESSON_COMPLETION',
            referenceId: lessonId,
            amount: EXP.LESSON_COMPLETION,
          }),
        ],
        skipDuplicates: true,
      });

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { totalExp: { increment: EXP.LESSON_COMPLETION } },
        select: { totalExp: true },
      });

      expect(tx.userCharacter.createMany).toHaveBeenCalledWith({
        data: [{ userId, characterId: 'char-ngo-quyen' }],
        skipDuplicates: true,
      });

      expect(tx.userEvent.createMany).toHaveBeenCalledWith({
        data: [{ userId, eventId: 'event-bach-dang-938' }],
        skipDuplicates: true,
      });

      expect(result.expGained).toBe(EXP.LESSON_COMPLETION);
      expect(result.totalExp).toBe(20);
      expect(result.unlockedCharacters).toEqual([
        { id: 'char-ngo-quyen', name: 'Ngô Quyền', slug: 'ngo-quyen' },
      ]);
      expect(result.unlockedEvents).toEqual([
        { id: 'event-bach-dang-938', name: 'Chiến thắng Bạch Đằng', slug: 'chien-thang-bach-dang-938' },
      ]);
      expect(result.leveledUp).toBe(false);
      expect(result.currentLevel.name).toBe('Tân sinh');
    });

    it('idempotency: does not grant EXP and does not re-increment totalExp when re-completing the same lesson', async () => {
      const tx = mockPrisma._tx;

      // Re-completion: exp already granted so skipDuplicates results in count 0
      tx.expTransaction.createMany.mockResolvedValue({ count: 0 });
      tx.user.findUniqueOrThrow.mockResolvedValue({ totalExp: 20 });

      tx.lessonCharacter.findMany.mockResolvedValue([{ characterId: 'char-ngo-quyen' }]);
      tx.lessonEvent.findMany.mockResolvedValue([{ eventId: 'event-bach-dang-938' }]);

      tx.userCharacter.createMany.mockResolvedValue({ count: 0 });
      tx.userEvent.createMany.mockResolvedValue({ count: 0 });

      tx.historicalCharacter.findMany.mockResolvedValue([
        { id: 'char-ngo-quyen', name: 'Ngô Quyền', slug: 'ngo-quyen' },
      ]);
      tx.historicalEvent.findMany.mockResolvedValue([
        { id: 'event-bach-dang-938', name: 'Chiến thắng Bạch Đằng', slug: 'chien-thang-bach-dang-938' },
      ]);

      const result = await service.awardLessonReward(tx, userId, lessonId);

      expect(tx.user.update).not.toHaveBeenCalled();
      expect(result.expGained).toBe(0);
      expect(result.totalExp).toBe(20);
      expect(result.leveledUp).toBe(false);
    });

    it('detects level up when totalExp crosses a level threshold (e.g. from 90 to 110)', async () => {
      const tx = mockPrisma._tx;

      tx.expTransaction.createMany.mockResolvedValue({ count: 1 });
      tx.user.update.mockResolvedValue({ totalExp: 110 });

      tx.lessonCharacter.findMany.mockResolvedValue([]);
      tx.lessonEvent.findMany.mockResolvedValue([]);

      const result = await service.awardLessonReward(tx, userId, lessonId);

      expect(result.expGained).toBe(20);
      expect(result.totalExp).toBe(110);
      expect(result.leveledUp).toBe(true);
      expect(result.currentLevel.name).toBe('Học trò');
      expect(result.currentLevel.displayOrder).toBe(2);
    });
  });

  // =========================================================================
  // Quiz Reward
  // =========================================================================
  describe('awardQuizReward', () => {
    it('grants +10 completion EXP and +30 pass EXP (+40 total) when passing a quiz for the first time', async () => {
      const tx = mockPrisma._tx;

      tx.expTransaction.createMany
        .mockResolvedValueOnce({ count: 1 }) // QUIZ_COMPLETION
        .mockResolvedValueOnce({ count: 1 }); // QUIZ_PASS
      tx.user.update.mockResolvedValue({ totalExp: 40 });

      const result = await service.awardQuizReward(tx, userId, quizId, true);

      expect(tx.expTransaction.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId,
            type: 'QUIZ_COMPLETION',
            referenceId: quizId,
            amount: EXP.QUIZ_COMPLETION,
          }),
        ],
        skipDuplicates: true,
      });

      expect(tx.expTransaction.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId,
            type: 'QUIZ_PASS',
            referenceId: quizId,
            amount: EXP.QUIZ_PASS,
          }),
        ],
        skipDuplicates: true,
      });

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { totalExp: { increment: EXP.QUIZ_COMPLETION + EXP.QUIZ_PASS } },
        select: { totalExp: true },
      });

      expect(result.expGained).toBe(EXP.QUIZ_COMPLETION + EXP.QUIZ_PASS);
      expect(result.totalExp).toBe(40);
    });

    it('grants only +10 completion EXP when failing a quiz for the first time', async () => {
      const tx = mockPrisma._tx;

      tx.expTransaction.createMany.mockResolvedValueOnce({ count: 1 }); // QUIZ_COMPLETION
      tx.user.update.mockResolvedValue({ totalExp: 10 });

      const result = await service.awardQuizReward(tx, userId, quizId, false);

      expect(tx.expTransaction.createMany).toHaveBeenCalledTimes(1);
      expect(result.expGained).toBe(EXP.QUIZ_COMPLETION);
      expect(result.totalExp).toBe(10);
    });

    it('retake after failure: grants only +30 pass EXP if student failed previously and passes on retake', async () => {
      const tx = mockPrisma._tx;

      // Attempt 2: QUIZ_COMPLETION already exists (count 0), but QUIZ_PASS is newly granted (count 1)
      tx.expTransaction.createMany
        .mockResolvedValueOnce({ count: 0 }) // QUIZ_COMPLETION already granted
        .mockResolvedValueOnce({ count: 1 }); // QUIZ_PASS newly granted
      tx.user.update.mockResolvedValue({ totalExp: 40 });

      const result = await service.awardQuizReward(tx, userId, quizId, true);

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { totalExp: { increment: EXP.QUIZ_PASS } },
        select: { totalExp: true },
      });

      expect(result.expGained).toBe(EXP.QUIZ_PASS);
      expect(result.totalExp).toBe(40);
    });

    it('idempotency: grants 0 EXP when retaking a quiz that was already passed', async () => {
      const tx = mockPrisma._tx;

      tx.expTransaction.createMany
        .mockResolvedValueOnce({ count: 0 }) // QUIZ_COMPLETION
        .mockResolvedValueOnce({ count: 0 }); // QUIZ_PASS
      tx.user.findUniqueOrThrow.mockResolvedValue({ totalExp: 40 });

      const result = await service.awardQuizReward(tx, userId, quizId, true);

      expect(tx.user.update).not.toHaveBeenCalled();
      expect(result.expGained).toBe(0);
      expect(result.totalExp).toBe(40);
    });
  });

  // =========================================================================
  // Collection
  // =========================================================================
  describe('getUserCollection', () => {
    it('returns unlocked Character Cards and Event Cards with full details and count', async () => {
      const now = new Date();
      mockPrisma.userCharacter.findMany.mockResolvedValue([
        {
          characterId: 'char-1',
          unlockedAt: now,
          character: {
            id: 'char-1',
            name: 'Ngô Quyền',
            slug: 'ngo-quyen',
            avatar: 'https://example.com/ngo-quyen.jpg',
            shortDescription: 'Chủ tướng Bạch Đằng',
            biography: '...',
            birthYear: 898,
            deathYear: 944,
          },
        },
      ]);

      mockPrisma.userEvent.findMany.mockResolvedValue([
        {
          eventId: 'event-1',
          unlockedAt: now,
          event: {
            id: 'event-1',
            name: 'Chiến thắng Bạch Đằng',
            slug: 'chien-thang-bach-dang-938',
            description: 'Đánh tan quân Nam Hán',
            startDate: new Date('0938-12-01'),
            endDate: null,
            location: 'Sông Bạch Đằng',
          },
        },
      ]);

      const collection = await service.getUserCollection(userId);

      expect(collection.totalCharacters).toBe(1);
      expect(collection.totalEvents).toBe(1);
      expect(collection.totalCards).toBe(2);
      expect(collection.characters[0]).toMatchObject({
        id: 'char-1',
        name: 'Ngô Quyền',
        slug: 'ngo-quyen',
        unlockedAt: now,
      });
      expect(collection.events[0]).toMatchObject({
        id: 'event-1',
        name: 'Chiến thắng Bạch Đằng',
        slug: 'chien-thang-bach-dang-938',
        unlockedAt: now,
      });
    });
  });

  // =========================================================================
  // Level Progress calculation from Database Level table
  // =========================================================================
  describe('getUserLevelProgress & computeLevelProgress', () => {
    it('handles totalExp = 0: Cấp 1 Tân sinh, 0% tiến trình, cần 100 EXP để lên Học trò', async () => {
      const progress = await service.getUserLevelProgress(0);
      expect(progress.currentLevel.name).toBe('Tân sinh');
      expect(progress.currentLevel.displayOrder).toBe(1);
      expect(progress.nextLevel?.name).toBe('Học trò');
      expect(progress.expInCurrentLevel).toBe(0);
      expect(progress.expRemaining).toBe(100);
      expect(progress.progressPercentage).toBe(0);
      expect(progress.isMaxLevel).toBe(false);
    });

    it('handles đúng mốc: totalExp = 100: Cấp 2 Học trò, 0% tiến trình tới Học giả', async () => {
      const progress = await service.getUserLevelProgress(100);
      expect(progress.currentLevel.name).toBe('Học trò');
      expect(progress.currentLevel.displayOrder).toBe(2);
      expect(progress.nextLevel?.name).toBe('Học giả');
      expect(progress.expInCurrentLevel).toBe(0);
      expect(progress.expNeededForNextLevel).toBe(150);
      expect(progress.expRemaining).toBe(150);
      expect(progress.progressPercentage).toBe(0);
      expect(progress.isMaxLevel).toBe(false);
    });

    it('handles giữa hai mốc: totalExp = 150: Cấp 2 Học trò, 33% tiến trình, cần thêm 100 EXP', async () => {
      const progress = await service.getUserLevelProgress(150);
      expect(progress.currentLevel.name).toBe('Học trò');
      expect(progress.nextLevel?.name).toBe('Học giả');
      expect(progress.expInCurrentLevel).toBe(50);
      expect(progress.expNeededForNextLevel).toBe(150);
      expect(progress.expRemaining).toBe(100);
      expect(progress.progressPercentage).toBe(33);
      expect(progress.isMaxLevel).toBe(false);
    });

    it('handles vượt mốc: totalExp = 260: Cấp 3 Học giả, 4% tiến trình tới Hiền tài', async () => {
      const progress = await service.getUserLevelProgress(260);
      expect(progress.currentLevel.name).toBe('Học giả');
      expect(progress.nextLevel?.name).toBe('Hiền tài');
      expect(progress.expInCurrentLevel).toBe(10);
      expect(progress.expNeededForNextLevel).toBe(250);
      expect(progress.expRemaining).toBe(240);
      expect(progress.progressPercentage).toBe(4);
      expect(progress.isMaxLevel).toBe(false);
    });

    it('handles đúng mốc cấp cao nhất: totalExp = 1000: Cấp 5 Sử gia, 100%, isMaxLevel = true', async () => {
      const progress = await service.getUserLevelProgress(1000);
      expect(progress.currentLevel.name).toBe('Sử gia');
      expect(progress.currentLevel.displayOrder).toBe(5);
      expect(progress.nextLevel).toBeNull();
      expect(progress.expRemaining).toBe(0);
      expect(progress.progressPercentage).toBe(100);
      expect(progress.isMaxLevel).toBe(true);
    });

    it('handles vượt mốc cấp cao nhất: totalExp = 2500: Cấp 5 Sử gia, 100%, isMaxLevel = true', async () => {
      const progress = await service.getUserLevelProgress(2500);
      expect(progress.currentLevel.name).toBe('Sử gia');
      expect(progress.nextLevel).toBeNull();
      expect(progress.progressPercentage).toBe(100);
      expect(progress.isMaxLevel).toBe(true);
    });

    it('handles số âm: totalExp = -50: clamp về 0', async () => {
      const progress = await service.getUserLevelProgress(-50);
      expect(progress.totalExp).toBe(0);
      expect(progress.currentLevel.name).toBe('Tân sinh');
    });

    it('handles danh sách level rỗng: fallback an toàn không gây crash', () => {
      const progress = service.computeLevelProgress(100, []);
      expect(progress.currentLevel.name).toBe('Tân sinh');
      expect(progress.isMaxLevel).toBe(true);
    });
  });
});

