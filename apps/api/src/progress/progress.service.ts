import { Injectable } from '@nestjs/common';
import { ProgressStatus, PublishStatus } from '@history-learning/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a lesson for the current user.
   * Rule P3: Creates or keeps IN_PROGRESS, never downgrades COMPLETED.
   * Only PUBLISHED lessons; throws 404 LESSON_NOT_FOUND otherwise.
   * Idempotent & race-condition safe via skipDuplicates + conditional updateMany.
   */
  async startLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, status: true },
    });

    if (!lesson || lesson.status !== PublishStatus.PUBLISHED) {
      throw new AppError(ErrorCodes.LESSON_NOT_FOUND, 404, 'Bài học không tồn tại');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Create if not exists (atomic, skipDuplicates avoids 500 unique constraint error)
      await tx.lessonProgress.createMany({
        data: [
          {
            userId,
            lessonId,
            status: ProgressStatus.IN_PROGRESS,
            progress: 0,
            startedAt: now,
          },
        ],
        skipDuplicates: true,
      });

      // 2. If existed with NOT_STARTED, promote to IN_PROGRESS and set startedAt
      await tx.lessonProgress.updateMany({
        where: {
          userId,
          lessonId,
          status: ProgressStatus.NOT_STARTED,
        },
        data: {
          status: ProgressStatus.IN_PROGRESS,
          startedAt: now,
        },
      });

      // 3. If existed with IN_PROGRESS but startedAt is null, set startedAt
      await tx.lessonProgress.updateMany({
        where: {
          userId,
          lessonId,
          status: ProgressStatus.IN_PROGRESS,
          startedAt: null,
        },
        data: {
          startedAt: now,
        },
      });

      // If status is already COMPLETED, nothing above matches, so COMPLETED is never downgraded.

      // 4. Return current progress record
      return tx.lessonProgress.findUniqueOrThrow({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        select: {
          id: true,
          userId: true,
          lessonId: true,
          status: true,
          progress: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  /**
   * Complete a lesson for the current user.
   * Rule P3: Sets status to COMPLETED and progress=100.
   * completedAt is recorded only on first completion; repeated calls return the same result.
   * If startedAt is null, sets startedAt = now without overwriting if already present.
   * Only PUBLISHED lessons; throws 404 LESSON_NOT_FOUND otherwise.
   * Idempotent & race-condition safe via skipDuplicates + conditional updateMany.
   */
  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, status: true },
    });

    if (!lesson || lesson.status !== PublishStatus.PUBLISHED) {
      throw new AppError(ErrorCodes.LESSON_NOT_FOUND, 404, 'Bài học không tồn tại');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Create if not exists (completed directly without prior start)
      await tx.lessonProgress.createMany({
        data: [
          {
            userId,
            lessonId,
            status: ProgressStatus.COMPLETED,
            progress: 100,
            startedAt: now,
            completedAt: now,
          },
        ],
        skipDuplicates: true,
      });

      // 2. If existed and startedAt is null, set startedAt = now (do not overwrite if already set)
      await tx.lessonProgress.updateMany({
        where: {
          userId,
          lessonId,
          startedAt: null,
        },
        data: {
          startedAt: now,
        },
      });

      // 3. If existed and completedAt is null, mark COMPLETED, progress=100, completedAt = now
      await tx.lessonProgress.updateMany({
        where: {
          userId,
          lessonId,
          completedAt: null,
        },
        data: {
          status: ProgressStatus.COMPLETED,
          progress: 100,
          completedAt: now,
        },
      });

      // 4. Return current progress record
      return tx.lessonProgress.findUniqueOrThrow({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        select: {
          id: true,
          userId: true,
          lessonId: true,
          status: true,
          progress: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  }

  /**
   * Get all lesson progress records for the current user.
   * Fields: lessonId, status, progress, startedAt, completedAt.
   */
  async getMyProgress(userId: string) {
    return this.prisma.lessonProgress.findMany({
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
  }
}
