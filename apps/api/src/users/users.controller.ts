import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateProfileSchema } from '@history-learning/shared';
import type { User } from '../generated/prisma/client';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, fullName: true, avatar: true,
        role: true, gradeId: true, totalExp: true, status: true,
        createdAt: true,
        grade: { select: { id: true, name: true, code: true } },
      },
    });
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() body: unknown) {
    const dto = UpdateProfileSchema.parse(body);
    return this.prisma.user.update({
      where: { id: user.id },
      data: dto,
      select: {
        id: true, email: true, fullName: true, avatar: true,
        role: true, gradeId: true, totalExp: true,
      },
    });
  }

  @Get('me/progress')
  async getProgress(@CurrentUser() user: User) {
    // TODO: paginate
    return this.prisma.lessonProgress.findMany({
      where: { userId: user.id },
      include: { lesson: { select: { id: true, title: true, slug: true, thumbnail: true } } },
    });
  }

  @Get('me/collection')
  async getCollection(@CurrentUser() user: User) {
    return this.prisma.userCard.findMany({
      where: { userId: user.id },
      include: { card: true },
    });
  }

  @Get('me/missions')
  async getMissions(@CurrentUser() user: User) {
    return this.prisma.userMission.findMany({
      where: { userId: user.id },
      include: { mission: true },
    });
  }
}
