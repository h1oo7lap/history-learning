import { Injectable } from '@nestjs/common';
import { PublishStatus, PAGINATION } from '@history-learning/shared';
import type { CreateQuizDto, UpdateQuizDto, QuestionDto } from '@history-learning/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { paginate } from '../common/pagination/paginate';
import { Prisma } from '../generated/prisma/client';

const QUIZ_INCLUDE = {
  questions: {
    include: { answers: { orderBy: { displayOrder: 'asc' as const } } },
    orderBy: { displayOrder: 'asc' as const },
  },
  lesson: { select: { id: true, title: true, slug: true } },
} as const;

const QUIZ_LIST_SELECT = {
  id: true,
  lessonId: true,
  title: true,
  description: true,
  timeLimit: true,
  passScore: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  lesson: { select: { id: true, title: true, slug: true } },
  _count: { select: { questions: true } },
} as const;

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async adminFindAll(query: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const pageSize = Math.min(query.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE, PAGINATION.MAX_PAGE_SIZE);
    const page = Math.max(query.page ?? 1, 1);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.QuizWhereInput = {};
    if (query.status && query.status !== '') {
      where.status = query.status as Prisma.EnumPublishStatusFilter;
    }
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quiz.findMany({ where, select: QUIZ_LIST_SELECT, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.quiz.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  async adminFindOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id }, include: QUIZ_INCLUDE });
    if (!quiz) throw new AppError(ErrorCodes.QUIZ_NOT_FOUND, 404, 'Quiz khong ton tai');
    return quiz;
  }

  async adminCreate(dto: CreateQuizDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new AppError(ErrorCodes.LESSON_NOT_FOUND, 404, 'Bai hoc khong ton tai');

    const existing = await this.prisma.quiz.findUnique({ where: { lessonId: dto.lessonId } });
    if (existing) throw new AppError(ErrorCodes.QUIZ_NOT_FOUND, 409, 'Bai hoc da co quiz');

    return this.prisma.quiz.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        description: dto.description ?? null,
        timeLimit: dto.timeLimit ?? null,
        passScore: dto.passScore ?? 60,
        status: dto.status ?? PublishStatus.DRAFT,
      },
      include: QUIZ_INCLUDE,
    });
  }

  async adminUpdate(id: string, dto: UpdateQuizDto) {
    await this.ensureExists(id);
    return this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.timeLimit !== undefined && { timeLimit: dto.timeLimit }),
        ...(dto.passScore !== undefined && { passScore: dto.passScore }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: QUIZ_INCLUDE,
    });
  }

  async adminDelete(id: string) {
    await this.ensureExists(id);
    await this.prisma.quiz.delete({ where: { id } });
  }

  async adminSetQuestions(quizId: string, questions: QuestionDto[]) {
    await this.ensureExists(quizId);
    return this.prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { quizId } });
      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        await tx.question.create({
          data: {
            quizId,
            content: q.content,
            type: q.type,
            points: q.points ?? 1,
            explanation: q.explanation ?? null,
            displayOrder: q.displayOrder ?? qi,
            answers: {
              create: q.answers.map((a, ai) => ({
                content: a.content,
                isCorrect: a.isCorrect,
                displayOrder: a.displayOrder ?? ai,
              })),
            },
          },
        });
      }
      return tx.quiz.findUnique({ where: { id: quizId }, include: QUIZ_INCLUDE });
    });
  }

  async findPublishedByLessonId(lessonId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { lessonId, status: PublishStatus.PUBLISHED },
      include: QUIZ_INCLUDE,
    });
    if (!quiz) throw new AppError(ErrorCodes.QUIZ_NOT_FOUND, 404, 'Quiz khong ton tai hoac chua xuat ban');
    return quiz;
  }

  private async ensureExists(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id }, select: { id: true } });
    if (!quiz) throw new AppError(ErrorCodes.QUIZ_NOT_FOUND, 404, 'Quiz khong ton tai');
  }
}