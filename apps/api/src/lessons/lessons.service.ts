import { Injectable } from '@nestjs/common';
import { PublishStatus } from '@history-learning/shared';
import type {
  CreateLessonDto,
  UpdateLessonDto,
  LessonListQueryDto,
} from '@history-learning/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { paginate, getPaginationArgs } from '../common/pagination/paginate';
import { slugify, uniqueSlug } from '../common/utils/slugify';

/** Fields included when returning a lesson with relations */
const LESSON_INCLUDE = {
  grades: { include: { grade: true } },
  topics: { include: { topic: true } },
  periods: { include: { period: true } },
  characters: { include: { character: true } },
  events: { include: { event: true } },
  media: { orderBy: { displayOrder: 'asc' as const } },
  quiz: true,
} as const;

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public helpers
  // ---------------------------------------------------------------------------

  /**
   * Public list — only PUBLISHED lessons.
   * Supports pagination + optional search + grade/topic/period/difficulty filter.
   */
  async findAllPublic(query: LessonListQueryDto) {
    const { skip, take, page, pageSize } = getPaginationArgs(query);

    const where = {
      status: PublishStatus.PUBLISHED,
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
      ...(query.gradeId
        ? { grades: { some: { gradeId: query.gradeId } } }
        : {}),
      ...(query.topicId
        ? { topics: { some: { topicId: query.topicId } } }
        : {}),
      ...(query.periodId
        ? { periods: { some: { periodId: query.periodId } } }
        : {}),
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          grades: { include: { grade: true } },
          topics: { include: { topic: true } },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  /**
   * Get a single published lesson by slug (public).
   */
  async findOneBySlug(slug: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
      include: LESSON_INCLUDE,
    });
    if (!lesson) {
      throw new AppError(
        ErrorCodes.LESSON_NOT_FOUND,
        404,
        'Lesson not found',
      );
    }
    return lesson;
  }

  // ---------------------------------------------------------------------------
  // Admin operations
  // ---------------------------------------------------------------------------

  /**
   * Admin list — all statuses.
   * Supports pagination + search + status/grade/topic/difficulty filters.
   */
  async adminFindAll(query: LessonListQueryDto) {
    const { skip, take, page, pageSize } = getPaginationArgs(query);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
      ...(query.gradeId
        ? { grades: { some: { gradeId: query.gradeId } } }
        : {}),
      ...(query.topicId
        ? { topics: { some: { topicId: query.topicId } } }
        : {}),
      ...(query.periodId
        ? { periods: { some: { periodId: query.periodId } } }
        : {}),
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          grades: { include: { grade: true } },
          topics: { include: { topic: true } },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  /**
   * Get a single lesson by ID (admin) — includes all relations.
   */
  async adminFindOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: LESSON_INCLUDE,
    });
    if (!lesson) {
      throw new AppError(
        ErrorCodes.LESSON_NOT_FOUND,
        404,
        'Lesson not found',
      );
    }
    return lesson;
  }

  /**
   * Create a new lesson with relations.
   * Auto-generates slug from title if not provided.
   * Validates all relation IDs before creating.
   */
  async adminCreate(dto: CreateLessonDto) {
    // Generate slug
    const baseSlug = dto.slug ?? slugify(dto.title);
    const slug = await uniqueSlug(baseSlug, (s) =>
      this.prisma.lesson
        .findUnique({ where: { slug: s } })
        .then(Boolean),
    );

    // Validate relation IDs
    await this.validateRelationIds(dto);

    // Publish validation
    const status = dto.status ?? PublishStatus.DRAFT;
    if (status === PublishStatus.PUBLISHED) {
      this.validatePublish(dto.title, dto.content, dto.gradeIds ?? []);
    }

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary ?? null,
        content: dto.content,
        thumbnail: dto.thumbnail ?? null,
        difficulty: dto.difficulty,
        estimatedTime: dto.estimatedTime,
        displayOrder: dto.displayOrder,
        status,
        grades: {
          create: (dto.gradeIds ?? []).map((gradeId) => ({ gradeId })),
        },
        topics: {
          create: (dto.topicIds ?? []).map((topicId) => ({ topicId })),
        },
        periods: {
          create: (dto.periodIds ?? []).map((periodId) => ({ periodId })),
        },
        characters: {
          create: (dto.characters ?? []).map((c) => ({
            characterId: c.characterId,
            role: c.role ?? null,
          })),
        },
        events: {
          create: (dto.eventIds ?? []).map((eventId) => ({ eventId })),
        },
        media: {
          create: (dto.media ?? []).map((m, i) => ({
            type: m.type,
            url: m.url,
            title: m.title ?? null,
            description: m.description ?? null,
            displayOrder: m.displayOrder ?? i,
          })),
        },
      },
      include: LESSON_INCLUDE,
    });
  }

  /**
   * Update a lesson by ID.
   * Handles slug uniqueness, relation sync (delete-then-create), and publish validation.
   */
  async adminUpdate(id: string, dto: UpdateLessonDto) {
    const existing = await this.adminFindOne(id); // throws 404 if not found

    // Slug handling
    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      const conflict = await this.prisma.lesson.findUnique({
        where: { slug: dto.slug },
      });
      if (conflict) {
        throw new AppError(ErrorCodes.SLUG_TAKEN, 409, 'Slug is already taken');
      }
      slug = dto.slug;
    } else if (dto.title && dto.title !== existing.title && !dto.slug) {
      const baseSlug = slugify(dto.title);
      slug = await uniqueSlug(baseSlug, (s) =>
        this.prisma.lesson
          .findFirst({ where: { slug: s, NOT: { id } } })
          .then(Boolean),
      );
    }

    // Validate relation IDs (only for provided arrays)
    await this.validateRelationIds(dto);

    // Determine final status for publish validation
    const newStatus = dto.status ?? existing.status;
    if (newStatus === PublishStatus.PUBLISHED) {
      const finalTitle = dto.title ?? existing.title;
      const finalContent = dto.content ?? existing.content;
      // If gradeIds are provided in DTO, use them; otherwise use existing grades
      const finalGradeIds =
        dto.gradeIds !== undefined
          ? dto.gradeIds
          : existing.grades.map((g) => g.gradeId);
      this.validatePublish(finalTitle, finalContent, finalGradeIds ?? []);
    }

    // Build the update within a transaction for relation sync
    return this.prisma.$transaction(async (tx) => {
      // Sync relations: delete all, then re-create (only for provided arrays)
      if (dto.gradeIds !== undefined) {
        await tx.lessonGrade.deleteMany({ where: { lessonId: id } });
      }
      if (dto.topicIds !== undefined) {
        await tx.lessonTopic.deleteMany({ where: { lessonId: id } });
      }
      if (dto.periodIds !== undefined) {
        await tx.lessonPeriod.deleteMany({ where: { lessonId: id } });
      }
      if (dto.characters !== undefined) {
        await tx.lessonCharacter.deleteMany({ where: { lessonId: id } });
      }
      if (dto.eventIds !== undefined) {
        await tx.lessonEvent.deleteMany({ where: { lessonId: id } });
      }
      if (dto.media !== undefined) {
        await tx.lessonMedia.deleteMany({ where: { lessonId: id } });
      }

      return tx.lesson.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          slug,
          ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
          ...(dto.content !== undefined ? { content: dto.content } : {}),
          ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
          ...(dto.difficulty !== undefined
            ? { difficulty: dto.difficulty }
            : {}),
          ...(dto.estimatedTime !== undefined
            ? { estimatedTime: dto.estimatedTime }
            : {}),
          ...(dto.displayOrder !== undefined
            ? { displayOrder: dto.displayOrder }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          // Re-create relations if provided
          ...(dto.gradeIds !== undefined
            ? {
                grades: {
                  create: dto.gradeIds.map((gradeId) => ({ gradeId })),
                },
              }
            : {}),
          ...(dto.topicIds !== undefined
            ? {
                topics: {
                  create: dto.topicIds.map((topicId) => ({ topicId })),
                },
              }
            : {}),
          ...(dto.periodIds !== undefined
            ? {
                periods: {
                  create: dto.periodIds.map((periodId) => ({ periodId })),
                },
              }
            : {}),
          ...(dto.characters !== undefined
            ? {
                characters: {
                  create: dto.characters.map((c) => ({
                    characterId: c.characterId,
                    role: c.role ?? null,
                  })),
                },
              }
            : {}),
          ...(dto.eventIds !== undefined
            ? {
                events: {
                  create: dto.eventIds.map((eventId) => ({ eventId })),
                },
              }
            : {}),
          ...(dto.media !== undefined
            ? {
                media: {
                  create: dto.media.map((m, i) => ({
                    type: m.type,
                    url: m.url,
                    title: m.title ?? null,
                    description: m.description ?? null,
                    displayOrder: m.displayOrder ?? i,
                  })),
                },
              }
            : {}),
        },
        include: LESSON_INCLUDE,
      });
    });
  }

  /**
   * Soft-delete a lesson by setting status to ARCHIVED.
   */
  async adminDelete(id: string) {
    await this.adminFindOne(id); // throws 404 if not found
    await this.prisma.lesson.update({
      where: { id },
      data: { status: PublishStatus.ARCHIVED },
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validate that all referenced relation IDs exist in the database.
   * Throws VALIDATION_ERROR with details if any are missing.
   */
  private async validateRelationIds(
    dto: Partial<Pick<CreateLessonDto, 'gradeIds' | 'topicIds' | 'periodIds' | 'characters' | 'eventIds'>>,
  ) {
    const errors: string[] = [];

    if (dto.gradeIds?.length) {
      const found = await this.prisma.grade.count({
        where: { id: { in: dto.gradeIds } },
      });
      if (found !== dto.gradeIds.length) {
        errors.push('One or more grade IDs are invalid');
      }
    }

    if (dto.topicIds?.length) {
      const found = await this.prisma.topic.count({
        where: { id: { in: dto.topicIds } },
      });
      if (found !== dto.topicIds.length) {
        errors.push('One or more topic IDs are invalid');
      }
    }

    if (dto.periodIds?.length) {
      const found = await this.prisma.historicalPeriod.count({
        where: { id: { in: dto.periodIds } },
      });
      if (found !== dto.periodIds.length) {
        errors.push('One or more period IDs are invalid');
      }
    }

    if (dto.characters?.length) {
      const charIds = dto.characters.map((c) => c.characterId);
      const found = await this.prisma.historicalCharacter.count({
        where: { id: { in: charIds } },
      });
      if (found !== charIds.length) {
        errors.push('One or more character IDs are invalid');
      }
    }

    if (dto.eventIds?.length) {
      const found = await this.prisma.historicalEvent.count({
        where: { id: { in: dto.eventIds } },
      });
      if (found !== dto.eventIds.length) {
        errors.push('One or more event IDs are invalid');
      }
    }

    if (errors.length) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        errors.join('; '),
      );
    }
  }

  /**
   * Validate publish requirements:
   * - title must not be empty
   * - content must not be empty
   * - at least 1 grade
   */
  private validatePublish(
    title: string,
    content: string,
    gradeIds: string[],
  ) {
    const errors: string[] = [];

    if (!title || title.trim().length === 0) {
      errors.push('Title is required for publishing');
    }
    if (!content || content.trim().length === 0) {
      errors.push('Content is required for publishing');
    }
    if (!gradeIds || gradeIds.length === 0) {
      errors.push('At least one grade is required for publishing');
    }

    if (errors.length) {
      throw new AppError(
        ErrorCodes.PUBLISH_VALIDATION_FAILED,
        400,
        errors.join('; '),
      );
    }
  }
}
