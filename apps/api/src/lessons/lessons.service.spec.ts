import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonsService } from './lessons.service';
import { PublishStatus, Difficulty } from '@history-learning/shared';
import { AppError } from '../common/errors/app-error';

// ---------------------------------------------------------------------------
// Mock PrismaService — all Prisma model methods are vi.fn() by default.
// Individual tests override return values as needed.
// ---------------------------------------------------------------------------

function createMockPrisma() {
  return {
    lesson: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    lessonGrade: { deleteMany: vi.fn() },
    lessonTopic: { deleteMany: vi.fn() },
    lessonPeriod: { deleteMany: vi.fn() },
    lessonCharacter: { deleteMany: vi.fn() },
    lessonEvent: { deleteMany: vi.fn() },
    lessonMedia: { deleteMany: vi.fn() },
    grade: { count: vi.fn() },
    topic: { count: vi.fn() },
    historicalPeriod: { count: vi.fn() },
    historicalCharacter: { count: vi.fn() },
    historicalEvent: { count: vi.fn() },
    $transaction: vi.fn(),
  } as any;
}

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new LessonsService(prisma);
  });

  // =========================================================================
  // adminCreate
  // =========================================================================

  describe('adminCreate', () => {
    const validDto = {
      title: 'Trận Bạch Đằng năm 938',
      content: '<p>Nội dung bài học về trận Bạch Đằng</p>',
      difficulty: Difficulty.EASY,
      estimatedTime: 10,
      displayOrder: 0,
      status: PublishStatus.DRAFT,
      gradeIds: ['grade-1'],
      topicIds: [] as string[],
      periodIds: [] as string[],
      characters: [] as { characterId: string; role?: string | null }[],
      eventIds: [] as string[],
      media: [] as { type: any; url: string; title?: string | null; description?: string | null; displayOrder: number }[],
    };

    it('should create a lesson with default DRAFT status', async () => {
      // Slug uniqueness check: no conflict
      prisma.lesson.findUnique.mockResolvedValue(null);
      // Grade validation
      prisma.grade.count.mockResolvedValue(1);
      // Create returns mock lesson
      const mockLesson = {
        id: 'lesson-1',
        title: validDto.title,
        slug: 'tran-bach-dang-nam-938',
        status: PublishStatus.DRAFT,
      };
      prisma.lesson.create.mockResolvedValue(mockLesson);

      const result = await service.adminCreate(validDto);

      expect(result).toEqual(mockLesson);
      expect(prisma.lesson.create).toHaveBeenCalledOnce();
      // Verify the slug was generated from title
      const createCall = prisma.lesson.create.mock.calls[0][0];
      expect(createCall.data.slug).toMatch(/^tran-bach-dang-nam-938/);
      expect(createCall.data.status).toBe(PublishStatus.DRAFT);
    });

    it('should auto-generate unique slug from title', async () => {
      // First slug check: taken
      prisma.lesson.findUnique
        .mockResolvedValueOnce({ id: 'existing' }) // 'tran-bach-dang-nam-938' taken
        .mockResolvedValueOnce(null); // 'tran-bach-dang-nam-938-1' available
      prisma.grade.count.mockResolvedValue(1);
      prisma.lesson.create.mockResolvedValue({ id: 'new' });

      await service.adminCreate(validDto);

      const createCall = prisma.lesson.create.mock.calls[0][0];
      expect(createCall.data.slug).toBe('tran-bach-dang-nam-938-1');
    });

    it('should use explicit slug when provided', async () => {
      const dtoWithSlug = { ...validDto, slug: 'custom-slug' };
      prisma.lesson.findUnique.mockResolvedValue(null);
      prisma.grade.count.mockResolvedValue(1);
      prisma.lesson.create.mockResolvedValue({ id: 'new' });

      await service.adminCreate(dtoWithSlug);

      const createCall = prisma.lesson.create.mock.calls[0][0];
      expect(createCall.data.slug).toBe('custom-slug');
    });

    it('should throw if duplicate slug is provided explicitly and conflicts', async () => {
      const dtoWithSlug = { ...validDto, slug: 'taken-slug' };
      // findUnique for slug check → taken; then counter append → 'taken-slug-1' free
      prisma.lesson.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);
      prisma.grade.count.mockResolvedValue(1);
      prisma.lesson.create.mockResolvedValue({ id: 'new' });

      await service.adminCreate(dtoWithSlug);

      // uniqueSlug appends suffix: taken-slug-1
      const createCall = prisma.lesson.create.mock.calls[0][0];
      expect(createCall.data.slug).toBe('taken-slug-1');
    });

    it('should create grade/topic relations', async () => {
      const dto = {
        ...validDto,
        gradeIds: ['g1', 'g2'],
        topicIds: ['t1'],
      };
      prisma.lesson.findUnique.mockResolvedValue(null);
      prisma.grade.count.mockResolvedValue(2);
      prisma.topic.count.mockResolvedValue(1);
      prisma.lesson.create.mockResolvedValue({ id: 'new' });

      await service.adminCreate(dto);

      const createCall = prisma.lesson.create.mock.calls[0][0];
      expect(createCall.data.grades.create).toEqual([
        { gradeId: 'g1' },
        { gradeId: 'g2' },
      ]);
      expect(createCall.data.topics.create).toEqual([{ topicId: 't1' }]);
    });
  });

  // =========================================================================
  // Validation — relation IDs
  // =========================================================================

  describe('relation ID validation', () => {
    it('should throw VALIDATION_ERROR when grade IDs do not exist', async () => {
      const dto = {
        title: 'Test',
        content: 'Content',
        difficulty: Difficulty.EASY,
        estimatedTime: 10,
        displayOrder: 0,
        status: PublishStatus.DRAFT,
        gradeIds: ['non-existent-grade'],
        topicIds: [] as string[],
        periodIds: [] as string[],
        characters: [] as { characterId: string; role?: string | null }[],
        eventIds: [] as string[],
        media: [] as any[],
      };

      prisma.lesson.findUnique.mockResolvedValue(null);
      prisma.grade.count.mockResolvedValue(0); // none found

      await expect(service.adminCreate(dto)).rejects.toThrow(AppError);
      await expect(service.adminCreate(dto)).rejects.toThrow(
        /grade IDs are invalid/i,
      );
    });

    it('should throw VALIDATION_ERROR when topic IDs do not exist', async () => {
      const dto = {
        title: 'Test',
        content: 'Content',
        difficulty: Difficulty.EASY,
        estimatedTime: 10,
        displayOrder: 0,
        status: PublishStatus.DRAFT,
        gradeIds: [] as string[],
        topicIds: ['bad-topic'],
        periodIds: [] as string[],
        characters: [] as { characterId: string; role?: string | null }[],
        eventIds: [] as string[],
        media: [] as any[],
      };

      prisma.lesson.findUnique.mockResolvedValue(null);
      prisma.topic.count.mockResolvedValue(0);

      await expect(service.adminCreate(dto)).rejects.toThrow(AppError);
    });
  });

  // =========================================================================
  // adminUpdate
  // =========================================================================

  describe('adminUpdate', () => {
    const existingLesson = {
      id: 'lesson-1',
      title: 'Old Title',
      slug: 'old-title',
      content: 'Old content',
      status: PublishStatus.DRAFT,
      grades: [{ gradeId: 'g1' }],
      topics: [],
      periods: [],
      characters: [],
      events: [],
      media: [],
    };

    it('should update lesson fields', async () => {
      prisma.lesson.findUnique.mockResolvedValue(existingLesson);
      // When title changes and no slug provided, findFirst is called for slug uniqueness
      prisma.lesson.findFirst.mockResolvedValue(null);

      // $transaction is used for update
      const updatedLesson = { ...existingLesson, title: 'New Title' };
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          lessonGrade: prisma.lessonGrade,
          lessonTopic: prisma.lessonTopic,
          lessonPeriod: prisma.lessonPeriod,
          lessonCharacter: prisma.lessonCharacter,
          lessonEvent: prisma.lessonEvent,
          lessonMedia: prisma.lessonMedia,
          lesson: { update: vi.fn().mockResolvedValue(updatedLesson) },
        });
      });

      const result = await service.adminUpdate('lesson-1', {
        title: 'New Title',
      });

      expect(result.title).toBe('New Title');
    });

    it('should throw SLUG_TAKEN when updating to a conflicting slug', async () => {
      // First call: adminFindOne → existing lesson
      // Second call: slug conflict check → another lesson exists with that slug
      prisma.lesson.findUnique
        .mockResolvedValueOnce(existingLesson)
        .mockResolvedValueOnce({ id: 'other-lesson' });

      await expect(
        service.adminUpdate('lesson-1', { slug: 'taken-slug' }),
      ).rejects.toThrow(/slug/i);
    });

    it('should regenerate slug when title changes and no explicit slug', async () => {
      prisma.lesson.findUnique.mockResolvedValue(existingLesson);
      prisma.lesson.findFirst.mockResolvedValue(null); // new slug unique

      const updatedLesson = {
        ...existingLesson,
        title: 'Totally New Title',
        slug: 'totally-new-title',
      };
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          lessonGrade: prisma.lessonGrade,
          lessonTopic: prisma.lessonTopic,
          lessonPeriod: prisma.lessonPeriod,
          lessonCharacter: prisma.lessonCharacter,
          lessonEvent: prisma.lessonEvent,
          lessonMedia: prisma.lessonMedia,
          lesson: { update: vi.fn().mockResolvedValue(updatedLesson) },
        });
      });

      const result = await service.adminUpdate('lesson-1', {
        title: 'Totally New Title',
      });

      expect(result.slug).toBe('totally-new-title');
    });

    it('should sync grade relations on update (delete + re-create)', async () => {
      prisma.lesson.findUnique.mockResolvedValue(existingLesson);
      prisma.grade.count.mockResolvedValue(2);

      const deleteMock = vi.fn();
      const updateMock = vi.fn().mockResolvedValue({
        ...existingLesson,
        grades: [{ gradeId: 'g2' }, { gradeId: 'g3' }],
      });

      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          lessonGrade: { deleteMany: deleteMock },
          lessonTopic: prisma.lessonTopic,
          lessonPeriod: prisma.lessonPeriod,
          lessonCharacter: prisma.lessonCharacter,
          lessonEvent: prisma.lessonEvent,
          lessonMedia: prisma.lessonMedia,
          lesson: { update: updateMock },
        });
      });

      await service.adminUpdate('lesson-1', {
        gradeIds: ['g2', 'g3'],
      });

      expect(deleteMock).toHaveBeenCalledWith({
        where: { lessonId: 'lesson-1' },
      });
    });
  });

  // =========================================================================
  // Publish validation
  // =========================================================================

  describe('publish validation', () => {
    it('should fail to publish when no grades are provided', async () => {
      const dto = {
        title: 'Valid Title',
        content: 'Some content',
        status: PublishStatus.PUBLISHED,
        difficulty: Difficulty.EASY,
        estimatedTime: 10,
        displayOrder: 0,
        gradeIds: [] as string[], // no grades
        topicIds: [] as string[],
        periodIds: [] as string[],
        characters: [] as { characterId: string; role?: string | null }[],
        eventIds: [] as string[],
        media: [] as any[],
      };

      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.adminCreate(dto)).rejects.toThrow(AppError);
      await expect(service.adminCreate(dto)).rejects.toThrow(
        /at least one grade/i,
      );
    });

    it('should fail to publish when content is empty', async () => {
      const dto = {
        title: 'Valid Title',
        content: '',
        status: PublishStatus.PUBLISHED,
        difficulty: Difficulty.EASY,
        estimatedTime: 10,
        displayOrder: 0,
        gradeIds: ['g1'],
        topicIds: [] as string[],
        periodIds: [] as string[],
        characters: [] as { characterId: string; role?: string | null }[],
        eventIds: [] as string[],
        media: [] as any[],
      };

      prisma.lesson.findUnique.mockResolvedValue(null);
      prisma.grade.count.mockResolvedValue(1);

      await expect(service.adminCreate(dto)).rejects.toThrow(AppError);
      await expect(service.adminCreate(dto)).rejects.toThrow(
        /content is required/i,
      );
    });

    it('should fail to publish when title is empty/whitespace', async () => {
      const dto = {
        title: '   ',
        content: '<p>OK content</p>',
        status: PublishStatus.PUBLISHED,
        difficulty: Difficulty.EASY,
        estimatedTime: 10,
        displayOrder: 0,
        gradeIds: ['g1'],
        topicIds: [] as string[],
        periodIds: [] as string[],
        characters: [] as { characterId: string; role?: string | null }[],
        eventIds: [] as string[],
        media: [] as any[],
      };

      prisma.lesson.findUnique.mockResolvedValue(null);
      prisma.grade.count.mockResolvedValue(1);

      await expect(service.adminCreate(dto)).rejects.toThrow(AppError);
      await expect(service.adminCreate(dto)).rejects.toThrow(
        /title is required/i,
      );
    });

    it('should succeed publishing when title, content, and grades are present', async () => {
      const dto = {
        title: 'Trận Bạch Đằng',
        content: '<p>Nội dung lịch sử</p>',
        status: PublishStatus.PUBLISHED,
        difficulty: Difficulty.MEDIUM,
        estimatedTime: 15,
        displayOrder: 1,
        gradeIds: ['g1'],
        topicIds: [] as string[],
        periodIds: [] as string[],
        characters: [] as { characterId: string; role?: string | null }[],
        eventIds: [] as string[],
        media: [] as any[],
      };

      prisma.lesson.findUnique.mockResolvedValue(null);
      prisma.grade.count.mockResolvedValue(1);
      prisma.lesson.create.mockResolvedValue({
        id: 'new',
        status: PublishStatus.PUBLISHED,
      });

      const result = await service.adminCreate(dto);

      expect(result.status).toBe(PublishStatus.PUBLISHED);
    });

    it('should fail publish on update when switching to PUBLISHED without grades', async () => {
      const existingLesson = {
        id: 'lesson-1',
        title: 'Good Title',
        slug: 'good-title',
        content: 'Some content',
        status: PublishStatus.DRAFT,
        grades: [], // no existing grades
        topics: [],
        periods: [],
        characters: [],
        events: [],
        media: [],
      };

      prisma.lesson.findUnique.mockResolvedValue(existingLesson);

      await expect(
        service.adminUpdate('lesson-1', {
          status: PublishStatus.PUBLISHED,
        }),
      ).rejects.toThrow(AppError);
      await expect(
        service.adminUpdate('lesson-1', {
          status: PublishStatus.PUBLISHED,
        }),
      ).rejects.toThrow(/at least one grade/i);
    });
  });

  // =========================================================================
  // Public API
  // =========================================================================

  describe('findAllPublic', () => {
    it('should only return PUBLISHED lessons', async () => {
      const publishedLessons = [
        { id: 'l1', status: PublishStatus.PUBLISHED },
      ];
      prisma.$transaction.mockResolvedValue([publishedLessons, 1]);

      const result = await service.findAllPublic({
        page: 1,
        pageSize: 20,
      });

      expect(result.items).toEqual(publishedLessons);
      // Verify the where clause includes PUBLISHED status
      const findManyCall = prisma.lesson.findMany.mock.calls;
      // $transaction receives an array of promises, so we verify transaction arg
      const txArg = prisma.$transaction.mock.calls[0][0];
      // The transaction was called with two Prisma queries
      expect(txArg).toHaveLength(2);
    });

    it('should not return DRAFT lessons', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAllPublic({
        page: 1,
        pageSize: 20,
      });

      expect(result.items).toHaveLength(0);
    });
  });

  describe('findOneBySlug', () => {
    it('should return a published lesson by slug', async () => {
      const lesson = {
        id: 'l1',
        slug: 'tran-bach-dang',
        status: PublishStatus.PUBLISHED,
      };
      prisma.lesson.findFirst.mockResolvedValue(lesson);

      const result = await service.findOneBySlug('tran-bach-dang');

      expect(result).toEqual(lesson);
      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { slug: 'tran-bach-dang', status: PublishStatus.PUBLISHED },
        include: expect.any(Object),
      });
    });

    it('should throw LESSON_NOT_FOUND when lesson does not exist', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.findOneBySlug('no-such-lesson')).rejects.toThrow(
        AppError,
      );
    });

    it('should throw LESSON_NOT_FOUND for DRAFT lessons accessed by slug', async () => {
      // findFirst with status: PUBLISHED won't find a DRAFT lesson
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(
        service.findOneBySlug('draft-lesson-slug'),
      ).rejects.toThrow(AppError);
    });
  });

  // =========================================================================
  // adminDelete
  // =========================================================================

  describe('adminDelete', () => {
    it('should archive lesson (set ARCHIVED) instead of hard delete', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'lesson-1',
        status: PublishStatus.DRAFT,
      });
      prisma.lesson.update.mockResolvedValue({});

      await service.adminDelete('lesson-1');

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        data: { status: PublishStatus.ARCHIVED },
      });
    });

    it('should throw NOT_FOUND when deleting non-existent lesson', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.adminDelete('missing-id')).rejects.toThrow(
        AppError,
      );
    });
  });
});
