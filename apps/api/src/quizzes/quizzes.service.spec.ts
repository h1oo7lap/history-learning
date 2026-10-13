import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizzesService } from './quizzes.service';
import { PublishStatus, QuestionType } from '@history-learning/shared';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';

function createMockPrisma() {
  return {
    quiz: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
    question: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  } as any;
}

describe('QuizzesService', () => {
  let service: QuizzesService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new QuizzesService(prisma);
  });

  // =========================================================================
  // adminFindAll
  // =========================================================================
  describe('adminFindAll', () => {
    it('returns paginated quizzes with defaults', async () => {
      const mockItems = [{ id: 'q-1', title: 'Quiz 1' }];
      prisma.$transaction.mockResolvedValue([mockItems, 1]);

      const result = await service.adminFindAll({});

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        items: mockItems,
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('applies search and status filters', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.adminFindAll({ page: 2, pageSize: 10, search: 'Bạch Đằng', status: PublishStatus.PUBLISHED });

      expect(prisma.$transaction).toHaveBeenCalled();
      const findManyCall = prisma.quiz.findMany.mock.calls[0]?.[0];
      expect(findManyCall.where.status).toBe(PublishStatus.PUBLISHED);
      expect(findManyCall.where.title).toEqual({ contains: 'Bạch Đằng', mode: 'insensitive' });
      expect(findManyCall.skip).toBe(10);
      expect(findManyCall.take).toBe(10);
    });
  });

  // =========================================================================
  // adminFindOne
  // =========================================================================
  describe('adminFindOne', () => {
    it('returns quiz when found', async () => {
      const mockQuiz = { id: 'q-1', title: 'Quiz 1', questions: [] };
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      const result = await service.adminFindOne('q-1');
      expect(result).toBe(mockQuiz);
      expect(prisma.quiz.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'q-1' } }),
      );
    });

    it('throws 404 AppError when quiz not found', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.adminFindOne('q-missing')).rejects.toThrow(AppError);
      await expect(service.adminFindOne('q-missing')).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.QUIZ_NOT_FOUND,
      });
    });
  });

  // =========================================================================
  // adminCreate
  // =========================================================================
  describe('adminCreate', () => {
    const validDto = {
      lessonId: 'lesson-1',
      title: 'Quiz Chiến dịch Điện Biên Phủ',
      description: 'Mô tả quiz',
      timeLimit: 300,
      passScore: 80,
      status: PublishStatus.DRAFT,
    };

    it('throws 404 AppError when lesson does not exist', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.adminCreate(validDto)).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.LESSON_NOT_FOUND,
      });
      expect(prisma.quiz.findUnique).not.toHaveBeenCalled();
    });

    it('throws 409 QUIZ_ALREADY_EXISTS when lesson already has a quiz', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      prisma.quiz.findUnique.mockResolvedValue({ id: 'existing-quiz' });

      await expect(service.adminCreate(validDto)).rejects.toMatchObject({
        status: 409,
        code: ErrorCodes.QUIZ_ALREADY_EXISTS,
      });
      expect(prisma.quiz.create).not.toHaveBeenCalled();
    });

    it('creates quiz with valid data and default values', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      prisma.quiz.findUnique.mockResolvedValue(null);
      const createdQuiz = { id: 'q-new', ...validDto };
      prisma.quiz.create.mockResolvedValue(createdQuiz);

      const result = await service.adminCreate(validDto);

      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: {
          lessonId: 'lesson-1',
          title: 'Quiz Chiến dịch Điện Biên Phủ',
          description: 'Mô tả quiz',
          timeLimit: 300,
          passScore: 80,
          status: PublishStatus.DRAFT,
        },
        include: expect.any(Object),
      });
      expect(result).toBe(createdQuiz);
    });

    it('uses defaults for optional fields', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      prisma.quiz.findUnique.mockResolvedValue(null);
      prisma.quiz.create.mockResolvedValue({ id: 'q-def' });

      await service.adminCreate({ lessonId: 'lesson-1', title: 'Tối giản' });

      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: {
          lessonId: 'lesson-1',
          title: 'Tối giản',
          description: null,
          timeLimit: null,
          passScore: 60,
          status: PublishStatus.DRAFT,
        },
        include: expect.any(Object),
      });
    });
  });

  // =========================================================================
  // adminUpdate
  // =========================================================================
  describe('adminUpdate', () => {
    it('throws 404 when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.adminUpdate('q-none', { title: 'New' })).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.QUIZ_NOT_FOUND,
      });
    });

    it('updates quiz fields when found', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'q-1' });
      const updated = { id: 'q-1', title: 'Updated Title' };
      prisma.quiz.update.mockResolvedValue(updated);

      const result = await service.adminUpdate('q-1', {
        title: 'Updated Title',
        passScore: 75,
      });

      expect(prisma.quiz.update).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        data: {
          title: 'Updated Title',
          passScore: 75,
        },
        include: expect.any(Object),
      });
      expect(result).toBe(updated);
    });
  });

  // =========================================================================
  // adminDelete
  // =========================================================================
  describe('adminDelete', () => {
    it('throws 404 when quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.adminDelete('q-none')).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.QUIZ_NOT_FOUND,
      });
    });

    it('deletes quiz successfully', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'q-1' });
      prisma.quiz.delete.mockResolvedValue({ id: 'q-1' });

      await service.adminDelete('q-1');

      expect(prisma.quiz.delete).toHaveBeenCalledWith({ where: { id: 'q-1' } });
    });
  });

  // =========================================================================
  // adminSetQuestions
  // =========================================================================
  describe('adminSetQuestions', () => {
    it('throws 404 if quiz does not exist', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.adminSetQuestions('q-none', [])).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.QUIZ_NOT_FOUND,
      });
    });

    it('atomically deletes and recreates questions within transaction', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'q-1' });

      const txMock = {
        question: {
          deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
          create: vi.fn().mockResolvedValue({ id: 'new-q' }),
        },
        quiz: {
          findUnique: vi.fn().mockResolvedValue({ id: 'q-1', questions: [{ id: 'new-q' }] }),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(txMock);
      });

      const questions = [
        {
          content: 'Năm nào diễn ra chiến thắng Bạch Đằng?',
          type: QuestionType.SINGLE_CHOICE,
          points: 2,
          explanation: 'Năm 938 Ngô Quyền đánh tan quân Nam Hán.',
          displayOrder: 0,
          answers: [
            { content: '938', isCorrect: true, displayOrder: 0 },
            { content: '1077', isCorrect: false, displayOrder: 1 },
          ],
        },
      ];

      const result = await service.adminSetQuestions('q-1', questions);

      expect(txMock.question.deleteMany).toHaveBeenCalledWith({ where: { quizId: 'q-1' } });
      expect(txMock.question.create).toHaveBeenCalledWith({
        data: {
          quizId: 'q-1',
          content: 'Năm nào diễn ra chiến thắng Bạch Đằng?',
          type: QuestionType.SINGLE_CHOICE,
          points: 2,
          explanation: 'Năm 938 Ngô Quyền đánh tan quân Nam Hán.',
          displayOrder: 0,
          answers: {
            create: [
              { content: '938', isCorrect: true, displayOrder: 0 },
              { content: '1077', isCorrect: false, displayOrder: 1 },
            ],
          },
        },
      });
      expect(txMock.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual({ id: 'q-1', questions: [{ id: 'new-q' }] });
    });
  });

  // =========================================================================
  // findPublishedByLessonId
  // =========================================================================
  describe('findPublishedByLessonId', () => {
    it('throws 404 when published quiz not found', async () => {
      prisma.quiz.findFirst.mockResolvedValue(null);

      await expect(service.findPublishedByLessonId('lesson-1')).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.QUIZ_NOT_FOUND,
      });
    });

    it('returns published quiz for lesson', async () => {
      const mockQuiz = { id: 'q-pub', lessonId: 'lesson-1', status: PublishStatus.PUBLISHED };
      prisma.quiz.findFirst.mockResolvedValue(mockQuiz);

      const result = await service.findPublishedByLessonId('lesson-1');
      expect(result).toBe(mockQuiz);
      expect(prisma.quiz.findFirst).toHaveBeenCalledWith({
        where: { lessonId: 'lesson-1', status: PublishStatus.PUBLISHED },
        include: expect.any(Object),
      });
    });
  });
});
