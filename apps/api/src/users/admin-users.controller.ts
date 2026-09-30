import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('Admin - Users')
@Controller('admin/users')
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, status: true, createdAt: true },
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true, status: true, gradeId: true, totalExp: true, createdAt: true },
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { status?: string; role?: string }) {
    return this.prisma.user.update({ where: { id }, data: body as never });
  }
}
