import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EXP } from '../common/config/constants';
import type {
  UserLevelProgressDto,
  GamificationRewardLevelDto,
  LeaderboardResponseDto,
  LeaderboardEntryDto,
  CurrentUserLeaderboardDto,
} from '@history-learning/shared';

type TransactionClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

export interface LessonRewardResult {
  expGained: number;
  totalExp: number;
  leveledUp: boolean;
  currentLevel: {
    id: string;
    name: string;
    displayOrder: number;
    requiredExp: number;
  };
  unlockedCharacters: Array<{ id: string; name: string; slug: string }>;
  unlockedEvents: Array<{ id: string; name: string; slug: string }>;
}

export interface QuizRewardResult {
  expGained: number;
  totalExp: number;
  leveledUp: boolean;
  currentLevel: {
    id: string;
    name: string;
    displayOrder: number;
    requiredExp: number;
  };
}

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reward student upon completing a lesson.
   * Idempotent:
   * - ExpTransaction unique on (userId, LESSON_COMPLETION, lessonId). Repeated calls grant 0 EXP.
   * - UserCharacter unique on (userId, characterId). Repeated calls skip existing unlocks.
   * - UserEvent unique on (userId, eventId). Repeated calls skip existing unlocks.
   */
  async awardLessonReward(
    tx: TransactionClient,
    userId: string,
    lessonId: string,
  ): Promise<LessonRewardResult> {
    // 1. Award EXP idempotently
    const expResult = await tx.expTransaction.createMany({
      data: [
        {
          userId,
          type: 'LESSON_COMPLETION',
          referenceId: lessonId,
          amount: EXP.LESSON_COMPLETION,
          description: 'Hoàn thành bài học',
        },
      ],
      skipDuplicates: true,
    });

    const expGained = expResult.count > 0 ? EXP.LESSON_COMPLETION : 0;

    let userTotalExp: number;
    let oldExp: number;

    if (expGained > 0) {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { totalExp: { increment: expGained } },
        select: { totalExp: true },
      });
      userTotalExp = updatedUser.totalExp;
      oldExp = userTotalExp - expGained;
    } else {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { totalExp: true },
      });
      userTotalExp = user.totalExp;
      oldExp = userTotalExp;
    }

    // 2. Unlock characters and events associated with this lesson
    const [lessonChars, lessonEvents] = await Promise.all([
      tx.lessonCharacter.findMany({
        where: { lessonId },
        select: { characterId: true },
      }),
      tx.lessonEvent.findMany({
        where: { lessonId },
        select: { eventId: true },
      }),
    ]);

    let unlockedCharacters: Array<{ id: string; name: string; slug: string }> = [];
    if (lessonChars.length > 0) {
      await tx.userCharacter.createMany({
        data: lessonChars.map((c) => ({
          userId,
          characterId: c.characterId,
        })),
        skipDuplicates: true,
      });

      unlockedCharacters = await tx.historicalCharacter.findMany({
        where: { id: { in: lessonChars.map((c) => c.characterId) } },
        select: { id: true, name: true, slug: true },
      });
    }

    let unlockedEvents: Array<{ id: string; name: string; slug: string }> = [];
    if (lessonEvents.length > 0) {
      await tx.userEvent.createMany({
        data: lessonEvents.map((e) => ({
          userId,
          eventId: e.eventId,
        })),
        skipDuplicates: true,
      });

      unlockedEvents = await tx.historicalEvent.findMany({
        where: { id: { in: lessonEvents.map((e) => e.eventId) } },
        select: { id: true, name: true, slug: true },
      });
    }

    // 3. Level check
    const { leveledUp, currentLevel } = await this.checkLevelUp(tx, oldExp, userTotalExp);

    return {
      expGained,
      totalExp: userTotalExp,
      leveledUp,
      currentLevel,
      unlockedCharacters,
      unlockedEvents,
    };
  }

  /**
   * Reward student upon submitting a quiz attempt.
   * Idempotent:
   * - ExpTransaction unique on (userId, QUIZ_COMPLETION, quizId).
   * - ExpTransaction unique on (userId, QUIZ_PASS, quizId).
   * Retaking cannot farm already granted completion or pass EXP.
   */
  async awardQuizReward(
    tx: TransactionClient,
    userId: string,
    quizId: string,
    passed: boolean,
  ): Promise<QuizRewardResult> {
    let expGained = 0;

    // 1. Completion EXP (+10)
    const compResult = await tx.expTransaction.createMany({
      data: [
        {
          userId,
          type: 'QUIZ_COMPLETION',
          referenceId: quizId,
          amount: EXP.QUIZ_COMPLETION,
          description: 'Hoàn thành bài quiz',
        },
      ],
      skipDuplicates: true,
    });

    if (compResult.count > 0) {
      expGained += EXP.QUIZ_COMPLETION;
    }

    // 2. Pass EXP (+30) if passed
    if (passed) {
      const passResult = await tx.expTransaction.createMany({
        data: [
          {
            userId,
            type: 'QUIZ_PASS',
            referenceId: quizId,
            amount: EXP.QUIZ_PASS,
            description: 'Vượt qua bài quiz',
          },
        ],
        skipDuplicates: true,
      });

      if (passResult.count > 0) {
        expGained += EXP.QUIZ_PASS;
      }
    }

    let userTotalExp: number;
    let oldExp: number;

    if (expGained > 0) {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { totalExp: { increment: expGained } },
        select: { totalExp: true },
      });
      userTotalExp = updatedUser.totalExp;
      oldExp = userTotalExp - expGained;
    } else {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { totalExp: true },
      });
      userTotalExp = user.totalExp;
      oldExp = userTotalExp;
    }

    // 3. Level check
    const { leveledUp, currentLevel } = await this.checkLevelUp(tx, oldExp, userTotalExp);

    return {
      expGained,
      totalExp: userTotalExp,
      leveledUp,
      currentLevel,
    };
  }

  /**
   * Determine user level based on totalExp against the Level table.
   */
  async checkLevelUp(
    tx: TransactionClient,
    oldExp: number,
    newExp: number,
  ) {
    const levels = await tx.level.findMany({
      orderBy: { requiredExp: 'asc' },
    });

    const oldProgress = this.computeLevelProgress(oldExp, levels);
    const newProgress = this.computeLevelProgress(newExp, levels);

    return {
      leveledUp: newProgress.currentLevel.displayOrder > oldProgress.currentLevel.displayOrder,
      currentLevel: newProgress.currentLevel,
    };
  }

  /**
   * Tính toán tiến trình cấp độ người dùng dựa trên totalExp và dữ liệu bảng Level trong DB.
   */
  async getUserLevelProgress(totalExp: number = 0): Promise<UserLevelProgressDto> {
    const levels = await this.prisma.level.findMany({
      orderBy: { requiredExp: 'asc' },
    });
    return this.computeLevelProgress(totalExp, levels);
  }

  /**
   * Thuật toán tính toán tiến trình cấp độ thuần túy nhận danh sách Level từ database.
   * Xử lý chính xác các trường hợp biên: 0 EXP, đúng mốc, giữa mốc, vượt mốc, mốc tối đa.
   */
  computeLevelProgress(
    totalExp: number = 0,
    levels: Array<{ id: string; name: string; displayOrder: number; requiredExp: number }>,
  ): UserLevelProgressDto {
    const safeExp = Math.max(0, Math.floor(totalExp));

    if (!levels || levels.length === 0) {
      const defaultLevel: GamificationRewardLevelDto = {
        id: 'default',
        name: 'Tân sinh',
        requiredExp: 0,
        displayOrder: 1,
      };
      return {
        currentLevel: defaultLevel,
        nextLevel: null,
        totalExp: safeExp,
        expInCurrentLevel: safeExp,
        expNeededForNextLevel: 0,
        expRemaining: 0,
        progressPercentage: 100,
        isMaxLevel: true,
      };
    }

    const sorted = [...levels].sort((a, b) => a.requiredExp - b.requiredExp);

    let currentIndex = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (safeExp >= sorted[i]!.requiredExp) {
        currentIndex = i;
      } else {
        break;
      }
    }

    const currentLevel = sorted[currentIndex]!;
    const nextLevel = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1]! : null;

    if (!nextLevel) {
      return {
        currentLevel,
        nextLevel: null,
        totalExp: safeExp,
        expInCurrentLevel: safeExp - currentLevel.requiredExp,
        expNeededForNextLevel: 0,
        expRemaining: 0,
        progressPercentage: 100,
        isMaxLevel: true,
      };
    }

    const expInCurrentLevel = safeExp - currentLevel.requiredExp;
    const expNeededForNextLevel = nextLevel.requiredExp - currentLevel.requiredExp;
    const expRemaining = Math.max(0, nextLevel.requiredExp - safeExp);
    const progressPercentage = Math.min(
      100,
      Math.max(0, Math.round((expInCurrentLevel / expNeededForNextLevel) * 100)),
    );

    return {
      currentLevel,
      nextLevel,
      totalExp: safeExp,
      expInCurrentLevel,
      expNeededForNextLevel,
      expRemaining,
      progressPercentage,
      isMaxLevel: false,
    };
  }

  /**
   * Get unlocked Character Cards and Event Cards for a user.
   */
  async getUserCollection(userId: string) {
    const [characters, events] = await Promise.all([
      this.prisma.userCharacter.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        include: {
          character: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatar: true,
              shortDescription: true,
              biography: true,
              birthYear: true,
              deathYear: true,
            },
          },
        },
      }),
      this.prisma.userEvent.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              description: true,
              startDate: true,
              endDate: true,
              location: true,
            },
          },
        },
      }),
    ]);

    return {
      characters: characters.map((uc) => ({
        ...uc.character,
        unlockedAt: uc.unlockedAt,
      })),
      events: events.map((ue) => ({
        ...ue.event,
        unlockedAt: ue.unlockedAt,
      })),
      totalCharacters: characters.length,
      totalEvents: events.length,
      totalCards: characters.length + events.length,
    };
  }

  /**
   * Bảng xếp hạng EXP theo lớp: top 10 và thứ hạng của người dùng hiện tại.
   */
  async getLeaderboard(
    targetGradeId?: string,
    currentUserId?: string,
  ): Promise<LeaderboardResponseDto> {
    // 1. Xác định lớp học cần xem bảng xếp hạng
    let targetGrade: {
      id: string;
      name: string;
      code: string;
      displayOrder: number;
      status: string;
    } | null = null;

    if (targetGradeId) {
      targetGrade = await this.prisma.grade.findUnique({
        where: { id: targetGradeId },
        select: { id: true, name: true, code: true, displayOrder: true, status: true },
      });
      if (!targetGrade || targetGrade.status !== 'ACTIVE') {
        throw new NotFoundException('Không tìm thấy lớp học hợp lệ');
      }
    } else {
      if (currentUserId) {
        const user = await this.prisma.user.findUnique({
          where: { id: currentUserId },
          select: { gradeId: true },
        });
        if (user?.gradeId) {
          targetGrade = await this.prisma.grade.findUnique({
            where: { id: user.gradeId },
            select: { id: true, name: true, code: true, displayOrder: true, status: true },
          });
        }
      }

      if (!targetGrade || targetGrade.status !== 'ACTIVE') {
        targetGrade = await this.prisma.grade.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
          select: { id: true, name: true, code: true, displayOrder: true, status: true },
        });
      }

      if (!targetGrade) {
        throw new NotFoundException('Chưa có dữ liệu lớp học');
      }
    }

    // 2. Lấy danh sách Level để tính huy hiệu cấp độ
    const levels = await this.prisma.level.findMany({
      orderBy: { requiredExp: 'asc' },
    });

    // 3. Truy vấn Top 10 học sinh có EXP cao nhất thuộc lớp
    const gradeWhere = {
      gradeId: targetGrade.id,
      status: 'ACTIVE' as const,
      role: 'USER' as const,
    };

    const [topUsers, totalParticipants] = await Promise.all([
      this.prisma.user.findMany({
        where: gradeWhere,
        orderBy: [
          { totalExp: 'desc' },
          { createdAt: 'asc' },
        ],
        take: 10,
        select: {
          id: true,
          fullName: true,
          avatar: true,
          totalExp: true,
          grade: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      this.prisma.user.count({ where: gradeWhere }),
    ]);

    const top10: LeaderboardEntryDto[] = topUsers.map((u, index) => {
      const levelProgress = this.computeLevelProgress(u.totalExp, levels);
      return {
        rank: index + 1,
        userId: u.id,
        fullName: u.fullName,
        avatar: u.avatar,
        totalExp: u.totalExp,
        level: levelProgress.currentLevel,
        grade: u.grade ?? {
          id: targetGrade!.id,
          name: targetGrade!.name,
          code: targetGrade!.code,
        },
        isCurrentUser: u.id === currentUserId,
      };
    });

    // 4. Xác định thứ hạng và thông tin của user hiện tại
    let currentUserDto: CurrentUserLeaderboardDto | null = null;

    if (currentUserId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          fullName: true,
          avatar: true,
          totalExp: true,
          gradeId: true,
          role: true,
          status: true,
          createdAt: true,
          grade: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      if (currentUser) {
        const isSameGrade =
          currentUser.gradeId === targetGrade.id &&
          currentUser.role === 'USER' &&
          currentUser.status === 'ACTIVE';

        const currentUserLevel = this.computeLevelProgress(currentUser.totalExp, levels);

        if (isSameGrade) {
          const foundInTop10 = top10.find((entry) => entry.userId === currentUser.id);
          let rank: number;
          if (foundInTop10) {
            rank = foundInTop10.rank;
          } else {
            const higherCount = await this.prisma.user.count({
              where: {
                ...gradeWhere,
                OR: [
                  { totalExp: { gt: currentUser.totalExp } },
                  {
                    totalExp: currentUser.totalExp,
                    createdAt: { lt: currentUser.createdAt },
                  },
                ],
              },
            });
            rank = higherCount + 1;
          }

          currentUserDto = {
            rank,
            userId: currentUser.id,
            fullName: currentUser.fullName,
            avatar: currentUser.avatar,
            totalExp: currentUser.totalExp,
            level: currentUserLevel.currentLevel,
            grade: currentUser.grade,
            isInTop10: rank <= 10,
            isSameGrade: true,
          };
        } else {
          currentUserDto = {
            rank: null,
            userId: currentUser.id,
            fullName: currentUser.fullName,
            avatar: currentUser.avatar,
            totalExp: currentUser.totalExp,
            level: currentUserLevel.currentLevel,
            grade: currentUser.grade,
            isInTop10: false,
            isSameGrade: false,
          };
        }
      }
    }

    return {
      grade: {
        id: targetGrade.id,
        name: targetGrade.name,
        code: targetGrade.code,
        displayOrder: targetGrade.displayOrder,
      },
      totalParticipants,
      top10,
      currentUser: currentUserDto,
    };
  }
}
