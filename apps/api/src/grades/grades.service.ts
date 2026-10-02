import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllEducationLevels() {
    return this.prisma.educationLevel.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        grades: {
          orderBy: { displayOrder: 'asc' },
          select: { id: true, name: true, code: true, displayOrder: true },
        },
      },
    });
  }

  async findAllGrades() {
    return this.prisma.grade.findMany({
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        displayOrder: true,
        educationLevel: { select: { id: true, name: true } },
      },
    });
  }
}
