import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import type { UpdateProfileDto } from '@history-learning/shared';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
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
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Validate gradeId if provided
    if (dto.gradeId) {
      const grade = await this.prisma.grade.findUnique({ where: { id: dto.gradeId } });
      if (!grade) throw new AppError('GRADE_NOT_FOUND', 404, 'Grade not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
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
    return this.prisma.userCard.findMany({
      where: { userId },
      orderBy: { obtainedAt: 'desc' },
      include: {
        card: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
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
