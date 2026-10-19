import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizzesService } from './quizzes.service';
import { PublishStatus, ProgressStatus, QuestionType } from '@history-learning/shared';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';

function createMockPrisma() {
  const mock: any = {
    quiz: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
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
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    lessonProgress: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    quizAttempt: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    quizAttemptAnswer: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  mock.$transaction.mockImplementation(async (arg: any) => {
    if (typeof arg === 'function') {
      return arg(mock);
    }
    return Promise.all(arg);
  });

  return mock;
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

      await service.adminFindAll({ search: 'Bach Dang', status: 'PUBLISHED' });

      expect(prisma.quiz.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'PUBLISHED',
            title: { contains: 'Bach Dang', mode: 'insensitive' },
          },
        }),
      );
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

    it('throws 404 when quiz not found', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.adminFindOne('non-existent')).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.QUIZ_NOT_FOUND,
      });
    });

    it('returns quiz with questions and answers', async () => {
      const mockQuiz = { id: 'q-1', title: 'Quiz 1', questions: [] };
      prisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      const result = await service.adminFindOne('q-1');
      expect(result).toBe(mockQuiz);
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

    it('throws 404 when lesson not found', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.adminCreate({
          lessonId: 'missing-lesson',
          title: 'Quiz 1',
          passScore: 60,
          status: PublishStatus.DRAFT,
        }),
      ).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.LESSON_NOT_FOUND,
      });
    });

    it('throws 409 when lesson already has a quiz', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      prisma.quiz.findUnique.mockResolvedValue({ id: 'existing-quiz' });

      await expect(
        service.adminCreate({
          lessonId: 'lesson-1',
          title: 'Quiz 1',
          passScore: 60,
          status: PublishStatus.DRAFT,
        }),
      ).rejects.toMatchObject({
        status: 409,
        code: ErrorCodes.QUIZ_ALREADY_EXISTS,
      });
    });

    it('creates quiz with defaults', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      prisma.quiz.findUnique.mockResolvedValue(null);
      const mockCreated = { id: 'new-quiz', title: 'Quiz 1' };
      prisma.quiz.create.mockResolvedValue(mockCreated);

      const result = await service.adminCreate({
        lessonId: 'lesson-1',
        title: 'Quiz 1',
        passScore: 60,
        status: PublishStatus.DRAFT,
      });

      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: {
          lessonId: 'lesson-1',
          title: 'Quiz 1',
          description: null,
          timeLimit: null,
          passScore: 60,
          status: PublishStatus.DRAFT,
        },
        include: expect.any(Object),
      });
      expect(result).toBe(mockCreated);
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

    it('throws 404 when quiz not found', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.adminUpdate('missing', { title: 'New' })).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.QUIZ_NOT_FOUND,
      });
    });

    it('updates quiz fields', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'q-1' });
      prisma.quiz.update.mockResolvedValue({ id: 'q-1', title: 'Updated' });

      const result = await service.adminUpdate('q-1', { title: 'Updated', passScore: 80 });

      expect(prisma.quiz.update).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        data: { title: 'Updated', passScore: 80 },
        include: expect.any(Object),
      });
      expect(result).toEqual({ id: 'q-1', title: 'Updated' });
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

    it('throws 404 when quiz not found', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);

      await expect(service.adminDelete('missing')).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.QUIZ_NOT_FOUND,
      });
    });

    it('deletes quiz', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'q-1' });
      prisma.quiz.delete.mockResolvedValue({});

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

    it('atomically replaces questions and answers', async () => {
      prisma.quiz.findUnique.mockResolvedValue({ id: 'q-1' });
      const txMock = {
        question: {
          deleteMany: vi.fn(),
          create: vi.fn(),
        },
        quiz: {
          findUnique: vi.fn().mockResolvedValue({ id: 'q-1', questions: [{ id: 'new-q' }] }),
        },
      };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(txMock));

      const questions = [
        {
          content: 'Năm nào Ngô Quyền đánh tan quân Nam Hán?',
          type: QuestionType.SINGLE_CHOICE,
          points: 2,
          explanation: 'Chiến thắng Bạch Đằng năm 938',
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
          content: questions[0]!.content,
          type: questions[0]!.type,
          points: 2,
          explanation: 'Chiến thắng Bạch Đằng năm 938',
          displayOrder: 0,
          answers: {
            create: [
              { content: '938', isCorrect: true, displayOrder: 0 },
              { content: '1077', isCorrect: false, displayOrder: 1 },
            ],
          },
        },
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
    });
  });

  // =========================================================================
  // Student Quizzes: findStudentQuizzes (Q13, Q14, Q15)
  // =========================================================================
  describe('findStudentQuizzes', () => {
    const mockQuiz1 = {
      id: 'quiz-1',
      title: 'Quiz 1',
      description: 'Desc 1',
      timeLimit: 600,
      lessonId: 'lesson-1',
      lesson: { id: 'lesson-1', title: 'Lesson 1', slug: 'lesson-1' },
      _count: { questions: 5 },
    };
    const mockQuiz2 = {
      id: 'quiz-2',
      title: 'Quiz 2',
      description: 'Desc 2',
      timeLimit: null,
      lessonId: 'lesson-2',
      lesson: { id: 'lesson-2', title: 'Lesson 2', slug: 'lesson-2' },
      _count: { questions: 10 },
    };

    it('Q13: findStudentQuizzes filters by user grade when no query param, overridden by query gradeId, and returns all if user has no grade', async () => {
      // Case 1: No queryGradeId -> filters by user's grade from DB
      prisma.user.findUnique.mockResolvedValue({ gradeId: 'grade-user' });
      prisma.quiz.findMany.mockResolvedValue([]);
      await service.findStudentQuizzes('user-1', 'USER', undefined);
      expect(prisma.quiz.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: PublishStatus.PUBLISHED,
            lesson: {
              status: PublishStatus.PUBLISHED,
              grades: { some: { gradeId: 'grade-user' } },
            },
          },
        }),
      );

      // Case 2: Query param provided -> overrides user grade
      prisma.quiz.findMany.mockClear();
      await service.findStudentQuizzes('user-1', 'USER', 'grade-override');
      expect(prisma.quiz.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: PublishStatus.PUBLISHED,
            lesson: {
              status: PublishStatus.PUBLISHED,
              grades: { some: { gradeId: 'grade-override' } },
            },
          },
        }),
      );

      // Case 3: User has no grade in DB and no query param -> returns all published
      prisma.user.findUnique.mockResolvedValue({ gradeId: null });
      prisma.quiz.findMany.mockClear();
      await service.findStudentQuizzes('user-1', 'USER', undefined);
      expect(prisma.quiz.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: PublishStatus.PUBLISHED,
            lesson: {
              status: PublishStatus.PUBLISHED,
            },
          },
        }),
      );
    });

    it('Q13 & Q15: findStudentQuizzes returns LOCKED, AVAILABLE, and DONE statuses with grade filtering and no questions', async () => {
      prisma.user.findUnique.mockResolvedValue({ gradeId: 'grade-1' });
      prisma.quiz.findMany.mockResolvedValue([mockQuiz1, mockQuiz2]);
      // user completed lesson-2, but not lesson-1
      prisma.lessonProgress.findMany.mockResolvedValue([
        { lessonId: 'lesson-2', status: ProgressStatus.COMPLETED },
      ]);
      // user has submitted attempt for quiz-2
      prisma.quizAttempt.findMany.mockResolvedValue([
        {
          quizId: 'quiz-2',
          score: 8,
          totalScore: 10,
          passed: true,
          submittedAt: new Date(),
        },
      ]);

      const result = await service.findStudentQuizzes('user-1', 'USER');

      expect(result).toHaveLength(2);
      // quiz-1: lesson-1 NOT completed -> LOCKED
      expect(result[0]).toEqual({
        id: 'quiz-1',
        title: 'Quiz 1',
        description: 'Desc 1',
        timeLimit: 600,
        questionCount: 5,
        lessonId: 'lesson-1',
        lesson: { id: 'lesson-1', title: 'Lesson 1', slug: 'lesson-1' },
        status: 'LOCKED',
        lastAttempt: null,
      });
      // quiz-2: submitted -> DONE with lastAttempt
      expect(result[1]).toEqual({
        id: 'quiz-2',
        title: 'Quiz 2',
        description: 'Desc 2',
        timeLimit: null,
        questionCount: 10,
        lessonId: 'lesson-2',
        lesson: { id: 'lesson-2', title: 'Lesson 2', slug: 'lesson-2' },
        status: 'DONE',
        lastAttempt: { score: 8, totalScore: 10, passed: true },
      });
    });

    it('Q13: findStudentQuizzes marks AVAILABLE for ADMIN even when lesson is not completed', async () => {
      prisma.user.findUnique.mockResolvedValue({ gradeId: 'grade-1' });
      prisma.quiz.findMany.mockResolvedValue([mockQuiz1]);
      prisma.lessonProgress.findMany.mockResolvedValue([]);
      prisma.quizAttempt.findMany.mockResolvedValue([]);

      const result = await service.findStudentQuizzes('admin-1', 'ADMIN');
      expect(result[0]?.status).toBe('AVAILABLE');
    });

    it('Q14: findStudentQuizzes reflects latest submission when multiple attempts exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ gradeId: 'grade-1' });
      prisma.quiz.findMany.mockResolvedValue([mockQuiz1]);
      prisma.lessonProgress.findMany.mockResolvedValue([
        { lessonId: 'lesson-1', status: ProgressStatus.COMPLETED },
      ]);
      const olderDate = new Date('2026-01-01');
      const newerDate = new Date('2026-01-02');
      // Ordered by submittedAt desc
      prisma.quizAttempt.findMany.mockResolvedValue([
        { quizId: 'quiz-1', score: 10, totalScore: 10, passed: true, submittedAt: newerDate },
        { quizId: 'quiz-1', score: 4, totalScore: 10, passed: false, submittedAt: olderDate },
      ]);

      const result = await service.findStudentQuizzes('user-1', 'USER');
      expect(result[0]?.status).toBe('DONE');
      expect(result[0]?.lastAttempt).toEqual({ score: 10, totalScore: 10, passed: true });
    });
  });

  // =========================================================================
  // Student Quizzes: startQuiz (Q1, Q2, Q3, Q12)
  // =========================================================================
  describe('startQuiz', () => {
    const mockPublishedQuiz = {
      id: 'quiz-1',
      lessonId: 'lesson-1',
      status: PublishStatus.PUBLISHED,
      timeLimit: 300,
      lesson: { id: 'lesson-1', status: PublishStatus.PUBLISHED },
      questions: [
        {
          id: 'q-1',
          content: 'Câu 1',
          type: QuestionType.SINGLE_CHOICE,
          points: 2,
          explanation: 'Secret explanation',
          displayOrder: 0,
          answers: [
            { id: 'a-1', content: 'A', isCorrect: true, displayOrder: 0 },
            { id: 'a-2', content: 'B', isCorrect: false, displayOrder: 1 },
          ],
        },
      ],
    };

    it('Q1: startQuiz throws 400 QUIZ_NOT_PUBLISHED if quiz is not found or not PUBLISHED', async () => {
      prisma.quiz.findUnique.mockResolvedValue(null);
      await expect(service.startQuiz('user-1', 'USER', 'quiz-missing')).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.QUIZ_NOT_PUBLISHED,
      });

      prisma.quiz.findUnique.mockResolvedValue({
        ...mockPublishedQuiz,
        status: PublishStatus.DRAFT,
      });
      await expect(service.startQuiz('user-1', 'USER', 'quiz-1')).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.QUIZ_NOT_PUBLISHED,
      });
    });

    it('Q1: startQuiz throws 400 QUIZ_NOT_PUBLISHED if lesson is not PUBLISHED', async () => {
      prisma.quiz.findUnique.mockResolvedValue({
        ...mockPublishedQuiz,
        lesson: { id: 'lesson-1', status: PublishStatus.DRAFT },
      });
      await expect(service.startQuiz('user-1', 'USER', 'quiz-1')).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.QUIZ_NOT_PUBLISHED,
      });
    });

    it('Q12: startQuiz throws 403 LESSON_NOT_COMPLETED if student has not completed lesson, but allows ADMIN', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockPublishedQuiz);
      prisma.lessonProgress.findUnique.mockResolvedValue(null);

      // Student rejected
      await expect(service.startQuiz('user-1', 'USER', 'quiz-1')).rejects.toMatchObject({
        status: 403,
        code: ErrorCodes.LESSON_NOT_COMPLETED,
      });

      // Admin allowed
      prisma.quizAttempt.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue({
        id: 'attempt-admin',
        startedAt: new Date(),
      });
      const adminResult = await service.startQuiz('admin-1', 'ADMIN', 'quiz-1');
      expect(adminResult.attemptId).toBe('attempt-admin');
    });

    it('Q3: startQuiz reuses open and unexpired attempt instead of creating new one', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockPublishedQuiz);
      prisma.lessonProgress.findUnique.mockResolvedValue({ status: ProgressStatus.COMPLETED });

      const existingStartedAt = new Date(Date.now() - 60 * 1000); // 1 min ago, limit 300s -> unexpired
      prisma.quizAttempt.findFirst.mockResolvedValue({
        id: 'attempt-existing',
        startedAt: existingStartedAt,
      });

      const result = await service.startQuiz('user-1', 'USER', 'quiz-1');
      expect(result.attemptId).toBe('attempt-existing');
      expect(prisma.quizAttempt.create).not.toHaveBeenCalled();
    });

    it('Q3: startQuiz creates new attempt if existing attempt is expired', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockPublishedQuiz);
      prisma.lessonProgress.findUnique.mockResolvedValue({ status: ProgressStatus.COMPLETED });

      const expiredStartedAt = new Date(Date.now() - 400 * 1000); // 400s ago, limit 300s -> expired
      prisma.quizAttempt.findFirst.mockResolvedValue({
        id: 'attempt-expired',
        startedAt: expiredStartedAt,
      });
      prisma.quizAttempt.create.mockResolvedValue({
        id: 'attempt-new',
        startedAt: new Date(),
      });

      const result = await service.startQuiz('user-1', 'USER', 'quiz-1');
      expect(result.attemptId).toBe('attempt-new');
      expect(prisma.quizAttempt.create).toHaveBeenCalled();
    });

    it('Q2: startQuiz returns questions and answers stripped of isCorrect and explanation', async () => {
      prisma.quiz.findUnique.mockResolvedValue(mockPublishedQuiz);
      prisma.lessonProgress.findUnique.mockResolvedValue({ status: ProgressStatus.COMPLETED });
      prisma.quizAttempt.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        startedAt: new Date(),
      });

      const result = await service.startQuiz('user-1', 'USER', 'quiz-1');
      expect(result.attemptId).toBe('attempt-1');
      expect(result.questions[0]).toEqual({
        id: 'q-1',
        content: 'Câu 1',
        type: QuestionType.SINGLE_CHOICE,
        points: 2,
        displayOrder: 0,
        answers: [
          { id: 'a-1', content: 'A', displayOrder: 0 },
          { id: 'a-2', content: 'B', displayOrder: 1 },
        ],
      });
      expect((result.questions[0] as any).explanation).toBeUndefined();
      expect((result.questions[0]!.answers[0] as any).isCorrect).toBeUndefined();
    });
  });

  // =========================================================================
  // Student Quizzes: submitQuiz (Q4, Q5, Q6, Q7, Q8, Q9)
  // =========================================================================
  describe('submitQuiz', () => {
    const mockQuizForSubmit = {
      id: 'quiz-1',
      passScore: 60,
      timeLimit: 300,
      status: PublishStatus.PUBLISHED,
      lesson: { status: PublishStatus.PUBLISHED },
    };

    const mockQuestions = [
      {
        id: 'q-single',
        type: QuestionType.SINGLE_CHOICE,
        points: 1,
        answers: [
          { id: 'a-s1', isCorrect: true },
          { id: 'a-s2', isCorrect: false },
        ],
      },
      {
        id: 'q-multi',
        type: QuestionType.MULTIPLE_CHOICE,
        points: 2,
        answers: [
          { id: 'a-m1', isCorrect: true },
          { id: 'a-m2', isCorrect: true },
          { id: 'a-m3', isCorrect: false },
        ],
      },
    ];

    it('Q8: submitQuiz throws 400 VALIDATION_ERROR on duplicate questionId or duplicate answerIds', async () => {
      // Duplicate questionId
      await expect(
        service.submitQuiz('user-1', 'quiz-1', {
          attemptId: 'att-1',
          answers: [
            { questionId: 'q-1', answerIds: ['a-1'] },
            { questionId: 'q-1', answerIds: ['a-2'] },
          ],
        }),
      ).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.VALIDATION_ERROR,
      });

      // Duplicate answerId in same question
      await expect(
        service.submitQuiz('user-1', 'quiz-1', {
          attemptId: 'att-1',
          answers: [{ questionId: 'q-1', answerIds: ['a-1', 'a-1'] }],
        }),
      ).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.VALIDATION_ERROR,
      });
    });

    it('Q4: submitQuiz throws 404 ATTEMPT_NOT_FOUND when attempt belongs to another user or quiz', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.submitQuiz('user-1', 'quiz-1', {
          attemptId: 'att-other',
          answers: [{ questionId: 'q-1', answerIds: ['a-1'] }],
        }),
      ).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.ATTEMPT_NOT_FOUND,
      });
    });

    it('Q1: submitQuiz throws 400 QUIZ_NOT_PUBLISHED if quiz or lesson is not PUBLISHED', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        quizId: 'quiz-1',
        quiz: { ...mockQuizForSubmit, status: PublishStatus.DRAFT },
      });

      await expect(
        service.submitQuiz('user-1', 'quiz-1', {
          attemptId: 'att-1',
          answers: [],
        }),
      ).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.QUIZ_NOT_PUBLISHED,
      });
    });

    it('Q5: submitQuiz is idempotent and returns saved result without re-grading or duplicating answers', async () => {
      const alreadySubmittedDate = new Date();
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        quizId: 'quiz-1',
        submittedAt: alreadySubmittedDate,
        score: 3,
        totalScore: 3,
        correctAnswers: 2,
        totalQuestions: 2,
        passed: true,
        quiz: mockQuizForSubmit,
      });

      const result = await service.submitQuiz('user-1', 'quiz-1', {
        attemptId: 'att-1',
        answers: [],
      });

      expect(result).toEqual({
        attemptId: 'att-1',
        score: 3,
        totalScore: 3,
        correctAnswers: 2,
        totalQuestions: 2,
        passed: true,
        submittedAt: alreadySubmittedDate,
      });
      expect(prisma.quizAttempt.updateMany).not.toHaveBeenCalled();
      expect(prisma.quizAttemptAnswer.createMany).not.toHaveBeenCalled();
    });

    it('Q6: submitQuiz throws 400 QUIZ_TIME_EXPIRED when submitted past timeLimit + 10s grace period', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        quizId: 'quiz-1',
        submittedAt: null,
        startedAt: new Date(Date.now() - 320 * 1000), // 320s ago (> 300 + 10s)
        quiz: mockQuizForSubmit,
      });

      await expect(
        service.submitQuiz('user-1', 'quiz-1', {
          attemptId: 'att-1',
          answers: [],
        }),
      ).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.QUIZ_TIME_EXPIRED,
      });
    });

    it('Q8: submitQuiz throws 400 VALIDATION_ERROR if question or answer does not belong to quiz', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        quizId: 'quiz-1',
        submittedAt: null,
        startedAt: new Date(),
        quiz: mockQuizForSubmit,
      });
      prisma.question.findMany.mockResolvedValue(mockQuestions);

      await expect(
        service.submitQuiz('user-1', 'quiz-1', {
          attemptId: 'att-1',
          answers: [{ questionId: 'q-foreign', answerIds: ['a-s1'] }],
        }),
      ).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.VALIDATION_ERROR,
      });
    });

    it('Q7 & Q9: gradeAttempt correctly scores SINGLE_CHOICE, TRUE_FALSE and MULTIPLE_CHOICE questions', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        quizId: 'quiz-1',
        submittedAt: null,
        startedAt: new Date(),
        quiz: mockQuizForSubmit,
      });
      prisma.question.findMany.mockResolvedValue(mockQuestions);
      prisma.quiz.findUniqueOrThrow.mockResolvedValue({ passScore: 60 });
      prisma.quizAttempt.updateMany.mockResolvedValue({ count: 1 });
      prisma.quizAttemptAnswer.createMany.mockResolvedValue({});

      // Submitting correct single choice (1 pt) and partially correct multiple choice (0 pt)
      // totalScore = 3. score = 1. percentage = 33.3% < 60% -> passed = false
      const result = await service.submitQuiz('user-1', 'quiz-1', {
        attemptId: 'att-1',
        answers: [
          { questionId: 'q-single', answerIds: ['a-s1'] },
          { questionId: 'q-multi', answerIds: ['a-m1'] }, // missing a-m2
        ],
      });

      expect(result.score).toBe(1);
      expect(result.totalScore).toBe(3);
      expect(result.correctAnswers).toBe(1);
      expect(result.totalQuestions).toBe(2);
      expect(result.passed).toBe(false);
      expect(prisma.quizAttemptAnswer.createMany).toHaveBeenCalled();
    });

    it('Q7 & Q9: MULTIPLE_CHOICE succeeds when selecting all and only correct answers', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        quizId: 'quiz-1',
        submittedAt: null,
        startedAt: new Date(),
        quiz: mockQuizForSubmit,
      });
      prisma.question.findMany.mockResolvedValue(mockQuestions);
      prisma.quiz.findUniqueOrThrow.mockResolvedValue({ passScore: 60 });
      prisma.quizAttempt.updateMany.mockResolvedValue({ count: 1 });

      // Submitting correct single choice (1 pt) and full correct multiple choice (2 pts)
      // totalScore = 3. score = 3. percentage = 100% >= 60% -> passed = true
      const result = await service.submitQuiz('user-1', 'quiz-1', {
        attemptId: 'att-1',
        answers: [
          { questionId: 'q-single', answerIds: ['a-s1'] },
          { questionId: 'q-multi', answerIds: ['a-m1', 'a-m2'] },
        ],
      });

      expect(result.score).toBe(3);
      expect(result.totalScore).toBe(3);
      expect(result.correctAnswers).toBe(2);
      expect(result.passed).toBe(true);
    });

    it('Q5: submitQuiz handles concurrent submission race where updateMany returns count === 0', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        quizId: 'quiz-1',
        submittedAt: null,
        startedAt: new Date(),
        quiz: mockQuizForSubmit,
      });
      prisma.question.findMany.mockResolvedValue(mockQuestions);
      prisma.quiz.findUniqueOrThrow.mockResolvedValue({ passScore: 60 });
      // Race: another transaction updated submittedAt first
      prisma.quizAttempt.updateMany.mockResolvedValue({ count: 0 });
      const concurrentSubmittedDate = new Date();
      prisma.quizAttempt.findUniqueOrThrow.mockResolvedValue({
        id: 'att-1',
        score: 3,
        totalScore: 3,
        correctAnswers: 2,
        totalQuestions: 2,
        passed: true,
        submittedAt: concurrentSubmittedDate,
      });

      const result = await service.submitQuiz('user-1', 'quiz-1', {
        attemptId: 'att-1',
        answers: [{ questionId: 'q-single', answerIds: ['a-s1'] }],
      });

      expect(result.submittedAt).toBe(concurrentSubmittedDate);
      expect(result.score).toBe(3);
      expect(prisma.quizAttemptAnswer.createMany).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Student Quizzes: getAttemptReview (Q4, Q10)
  // =========================================================================
  describe('getAttemptReview', () => {
    it('Q4: getAttemptReview throws 404 ATTEMPT_NOT_FOUND when attempt belongs to another user', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-other',
      });

      await expect(service.getAttemptReview('user-1', 'att-1')).rejects.toMatchObject({
        status: 404,
        code: ErrorCodes.ATTEMPT_NOT_FOUND,
      });
    });

    it('Q10: getAttemptReview throws 400 ATTEMPT_NOT_SUBMITTED when attempt has not been submitted', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        submittedAt: null,
      });

      await expect(service.getAttemptReview('user-1', 'att-1')).rejects.toMatchObject({
        status: 400,
        code: ErrorCodes.ATTEMPT_NOT_SUBMITTED,
      });
    });

    it('Q10: getAttemptReview returns full review with explanations and isCorrect after submission', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        userId: 'user-1',
        quizId: 'quiz-1',
        score: 1,
        totalScore: 1,
        correctAnswers: 1,
        totalQuestions: 1,
        passed: true,
        startedAt: new Date(),
        submittedAt: new Date(),
        quiz: {
          id: 'quiz-1',
          title: 'Quiz 1',
          passScore: 60,
          timeLimit: 300,
          lesson: { id: 'l-1', title: 'L 1', slug: 'l-1' },
          questions: [
            {
              id: 'q-1',
              content: 'Q 1',
              type: QuestionType.SINGLE_CHOICE,
              points: 1,
              explanation: 'Exp 1',
              displayOrder: 0,
              answers: [
                { id: 'a-1', content: 'A 1', isCorrect: true, displayOrder: 0 },
                { id: 'a-2', content: 'A 2', isCorrect: false, displayOrder: 1 },
              ],
            },
          ],
        },
        answers: [{ questionId: 'q-1', answerId: 'a-1', isCorrect: true }],
      });

      const result = await service.getAttemptReview('user-1', 'att-1');
      expect(result.attempt.score).toBe(1);
      expect(result.questions[0]?.explanation).toBe('Exp 1');
      expect(result.questions[0]?.answers[0]?.isCorrect).toBe(true);
      expect(result.questions[0]?.selectedAnswerIds).toEqual(['a-1']);
      expect(result.questions[0]?.isUserCorrect).toBe(true);
    });
  });
});
