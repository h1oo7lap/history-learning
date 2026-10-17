import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressService } from './progress.service';
import { ProgressStatus, PublishStatus } from '@history-learning/shared';
import { ErrorCodes } from '../common/errors/error-codes';

function createMockPrisma() {
  const tx = {
    lessonProgress: {
      createMany: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  };

  return {
    lesson: {
      findUnique: vi.fn(),
    },
    lessonProgress: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (prismaTx: typeof tx) => Promise<any>) => cb(tx)),
    _tx: tx,
  } as any;
}

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: ReturnType<typeof createMockPrisma>;

  const userId = 'user-1';
  const lessonId = 'lesson-1';

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ProgressService(prisma);
  });

  // =========================================================================
  // startLesson
  // =========================================================================
  describe('startLesson', () => {
    it('404: startLesson throws LESSON_NOT_FOUND when lesson does not exist', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.startLesson(userId, lessonId)).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCodes.LESSON_NOT_FOUND,
          status: 404,
        }),
      );
    });

    it('404: startLesson throws LESSON_NOT_FOUND when lesson is DRAFT', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        status: PublishStatus.DRAFT,
      });

      await expect(service.startLesson(userId, lessonId)).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCodes.LESSON_NOT_FOUND,
          status: 404,
        }),
      );
    });

    it('404: startLesson throws LESSON_NOT_FOUND when lesson is ARCHIVED', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        status: PublishStatus.ARCHIVED,
      });

      await expect(service.startLesson(userId, lessonId)).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCodes.LESSON_NOT_FOUND,
          status: 404,
        }),
      );
    });

    it('P3: startLesson creates new progress with IN_PROGRESS and startedAt when not exists', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        status: PublishStatus.PUBLISHED,
      });

      const mockResult = {
        id: 'prog-1',
        userId,
        lessonId,
        status: ProgressStatus.IN_PROGRESS,
        progress: 0,
        startedAt: new Date(),
        completedAt: null,
      };
      prisma._tx.lessonProgress.createMany.mockResolvedValue({ count: 1 });
      prisma._tx.lessonProgress.updateMany.mockResolvedValue({ count: 0 });
      prisma._tx.lessonProgress.findUniqueOrThrow.mockResolvedValue(mockResult);

      const result = await service.startLesson(userId, lessonId);

      expect(prisma._tx.lessonProgress.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId,
            lessonId,
            status: ProgressStatus.IN_PROGRESS,
            progress: 0,
          }),
        ],
        skipDuplicates: true,
      });
      expect(result).toEqual(mockResult);
    });

    it('P3: startLesson promotes NOT_STARTED to IN_PROGRESS and does not downgrade COMPLETED', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        status: PublishStatus.PUBLISHED,
      });

      const mockCompleted = {
        id: 'prog-1',
        userId,
        lessonId,
        status: ProgressStatus.COMPLETED,
        progress: 100,
        startedAt: new Date('2026-01-01'),
        completedAt: new Date('2026-01-02'),
      };
      prisma._tx.lessonProgress.createMany.mockResolvedValue({ count: 0 });
      prisma._tx.lessonProgress.updateMany.mockResolvedValue({ count: 0 });
      prisma._tx.lessonProgress.findUniqueOrThrow.mockResolvedValue(mockCompleted);

      const result = await service.startLesson(userId, lessonId);

      // Verify updateMany targets status: NOT_STARTED, never COMPLETED
      expect(prisma._tx.lessonProgress.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ProgressStatus.NOT_STARTED,
          }),
        }),
      );
      expect(result.status).toBe(ProgressStatus.COMPLETED);
    });
  });

  // =========================================================================
  // completeLesson
  // =========================================================================
  describe('completeLesson', () => {
    it('404: completeLesson throws LESSON_NOT_FOUND when lesson does not exist', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.completeLesson(userId, lessonId)).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCodes.LESSON_NOT_FOUND,
          status: 404,
        }),
      );
    });

    it('404: completeLesson throws LESSON_NOT_FOUND when lesson is DRAFT', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        status: PublishStatus.DRAFT,
      });

      await expect(service.completeLesson(userId, lessonId)).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCodes.LESSON_NOT_FOUND,
          status: 404,
        }),
      );
    });

    it('P3: completeLesson creates new progress with COMPLETED and progress=100 directly', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        status: PublishStatus.PUBLISHED,
      });

      const now = new Date();
      const mockResult = {
        id: 'prog-1',
        userId,
        lessonId,
        status: ProgressStatus.COMPLETED,
        progress: 100,
        startedAt: now,
        completedAt: now,
      };

      prisma._tx.lessonProgress.createMany.mockResolvedValue({ count: 1 });
      prisma._tx.lessonProgress.updateMany.mockResolvedValue({ count: 0 });
      prisma._tx.lessonProgress.findUniqueOrThrow.mockResolvedValue(mockResult);

      const result = await service.completeLesson(userId, lessonId);

      expect(prisma._tx.lessonProgress.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId,
            lessonId,
            status: ProgressStatus.COMPLETED,
            progress: 100,
          }),
        ],
        skipDuplicates: true,
      });
      expect(result).toEqual(mockResult);
    });

    it('P3: completeLesson sets startedAt = now if existing progress has startedAt null', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        status: PublishStatus.PUBLISHED,
      });

      prisma._tx.lessonProgress.createMany.mockResolvedValue({ count: 0 });
      prisma._tx.lessonProgress.updateMany.mockResolvedValue({ count: 1 });
      prisma._tx.lessonProgress.findUniqueOrThrow.mockResolvedValue({
        id: 'prog-1',
        userId,
        lessonId,
        status: ProgressStatus.COMPLETED,
        progress: 100,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      await service.completeLesson(userId, lessonId);

      // Verify updateMany targets startedAt: null
      expect(prisma._tx.lessonProgress.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startedAt: null,
          }),
          data: expect.objectContaining({
            startedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('P1/idempotent: completeLesson only writes completedAt when completedAt is null', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: lessonId,
        status: PublishStatus.PUBLISHED,
      });

      const originalCompletedAt = new Date('2026-01-01');
      prisma._tx.lessonProgress.createMany.mockResolvedValue({ count: 0 });
      prisma._tx.lessonProgress.updateMany.mockResolvedValue({ count: 0 });
      prisma._tx.lessonProgress.findUniqueOrThrow.mockResolvedValue({
        id: 'prog-1',
        userId,
        lessonId,
        status: ProgressStatus.COMPLETED,
        progress: 100,
        startedAt: originalCompletedAt,
        completedAt: originalCompletedAt,
      });

      await service.completeLesson(userId, lessonId);

      // Verify updateMany targets completedAt: null to avoid overwriting
      expect(prisma._tx.lessonProgress.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            completedAt: null,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // getMyProgress
  // =========================================================================
  describe('getMyProgress', () => {
    it('P3: getMyProgress returns user progress list filtered by userId', async () => {
      const mockList = [
        {
          lessonId: 'lesson-1',
          status: ProgressStatus.COMPLETED,
          progress: 100,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ];
      prisma.lessonProgress.findMany.mockResolvedValue(mockList);

      const result = await service.getMyProgress(userId);

      expect(prisma.lessonProgress.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          lessonId: true,
          status: true,
          progress: true,
          startedAt: true,
          completedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockList);
    });
  });
});
