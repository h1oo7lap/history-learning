import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import type { UpdateProfileDto } from '@history-learning/shared';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService?: GamificationService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        avatar: true,
        role: true,
        gradeId: true,
        totalExp: true,
        status: true,
        createdAt: true,
        grade: { select: { id: true, name: true, code: true } },
      },
    });

    if (!user) return null;

    const level = this.gamificationService
      ? await this.gamificationService.getUserLevelProgress(user.totalExp)
      : null;

    return {
      ...user,
      level,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        gradeId: true,
        firstName: true,
        lastName: true,
        fullName: true,
      },
    });
    if (!existing) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'User not found');
    }

    // Name lock: chỉ ADMIN mới được đổi tên của mình
    const isChangingFirstName = dto.firstName !== undefined && dto.firstName.trim() !== (existing.firstName || '');
    const isChangingLastName = dto.lastName !== undefined && dto.lastName.trim() !== (existing.lastName || '');
    const isChangingFullName = dto.fullName !== undefined && dto.fullName.trim() !== existing.fullName;
    const isChangingName = isChangingFirstName || isChangingLastName || isChangingFullName;

    if (existing.role !== 'ADMIN' && isChangingName) {
      throw new AppError(
        ErrorCodes.NAME_LOCKED,
        403,
        'Học sinh không thể tự đổi họ tên',
      );
    }

    // A4: Học sinh đã có gradeId thì KHÔNG được tự đổi lớp -> 403 GRADE_LOCKED
    if (dto.gradeId !== undefined && dto.gradeId !== existing.gradeId) {
      if (existing.role !== 'ADMIN' && existing.gradeId !== null) {
        throw new AppError(
          ErrorCodes.GRADE_LOCKED,
          403,
          'Học sinh không thể tự đổi lớp',
        );
      }

      if (dto.gradeId) {
        const grade = await this.prisma.grade.findUnique({ where: { id: dto.gradeId } });
        if (!grade) throw new AppError('GRADE_NOT_FOUND', 404, 'Grade not found');
      }
    }

    let firstName = dto.firstName?.trim();
    let lastName = dto.lastName?.trim();
    let fullName = dto.fullName?.trim();

    if (firstName !== undefined || lastName !== undefined) {
      const finalFirstName = firstName !== undefined ? firstName : (existing.firstName || '');
      const finalLastName = lastName !== undefined ? lastName : (existing.lastName || '');
      fullName = `${finalLastName} ${finalFirstName}`.trim();
    } else if (fullName !== undefined) {
      const parts = fullName.split(/\s+/);
      if (parts.length > 1) {
        firstName = parts.pop() || '';
        lastName = parts.join(' ');
      } else {
        firstName = fullName;
        lastName = '';
      }
    }

    const dataToUpdate: any = {
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      ...(fullName !== undefined ? { fullName } : {}),
      ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
      ...(dto.gradeId !== undefined ? { gradeId: dto.gradeId } : {}),
    };

    return this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        avatar: true,
        role: true,
        gradeId: true,
        totalExp: true,
        grade: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async getProgress(userId: string) {
    return this.prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            estimatedTime: true,
          },
        },
      },
    });
  }

  async getCollection(userId: string) {
    if (this.gamificationService) {
      return this.gamificationService.getUserCollection(userId);
    }
    return this.prisma.userCard.findMany({
      where: { userId },
      orderBy: { obtainedAt: 'desc' },
      include: {
        card: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            rarity: true,
            type: true,
          },
        },
      },
    });
  }

  async getMissions(userId: string) {
    return this.prisma.userMission.findMany({
      where: { userId },
      orderBy: [{ completed: 'asc' }, { completedAt: 'desc' }],
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            description: true,
            rewardExp: true,
            type: true,
            target: true,
          },
        },
      },
    });
  }
}
