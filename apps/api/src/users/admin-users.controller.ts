import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  gradeId: true,
  grade: { select: { id: true, name: true, code: true } },
  totalExp: true,
  createdAt: true,
} as const;

@ApiTags('Admin - Users')
@Controller('admin/users')
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.user.findMany({
      select: ADMIN_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: ADMIN_USER_SELECT,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { status?: string; role?: string; gradeId?: string | null },
  ) {
    if (body.gradeId) {
      const grade = await this.prisma.grade.findUnique({ where: { id: body.gradeId } });
      if (!grade) {
        throw new AppError('GRADE_NOT_FOUND', 404, 'Grade not found');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status as any } : {}),
        ...(body.role !== undefined ? { role: body.role as any } : {}),
        ...(body.gradeId !== undefined ? { gradeId: body.gradeId } : {}),
      },
      select: ADMIN_USER_SELECT,
    });
  }
}
