import { Injectable } from '@nestjs/common';
import { ActiveStatus } from '@history-learning/shared';
import type {
  CreateTopicDto,
  UpdateTopicDto,
  TaxonomyListQueryDto,
} from '@history-learning/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { paginate, getPaginationArgs } from '../common/pagination/paginate';
import { slugify, uniqueSlug } from '../common/utils/slugify';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public helpers
  // ---------------------------------------------------------------------------

  /**
   * Public list — only ACTIVE topics.
   * Supports pagination + optional name search.
   */
  async findAllPublic(query: TaxonomyListQueryDto) {
    const { skip, take, page, pageSize } = getPaginationArgs(query);

    const where = {
      status: ActiveStatus.ACTIVE,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.topic.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          thumbnail: true,
          displayOrder: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.topic.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  /**
   * Get a single active topic by slug (public).
   */
  async findOneBySlug(slug: string) {
    const topic = await this.prisma.topic.findFirst({
      where: { slug, status: ActiveStatus.ACTIVE },
    });
    if (!topic) {
      throw new AppError(ErrorCodes.TOPIC_NOT_FOUND, 404, 'Topic not found');
    }
    return topic;
  }

  // ---------------------------------------------------------------------------
  // Admin operations
  // ---------------------------------------------------------------------------

  /**
   * Admin list — all statuses. Supports pagination + search + status filter.
   */
  async adminFindAll(query: TaxonomyListQueryDto) {
    const { skip, take, page, pageSize } = getPaginationArgs(query);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.topic.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
      this.prisma.topic.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  /**
   * Get a single topic by ID (admin).
   */
  async adminFindOne(id: string) {
    const topic = await this.prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      throw new AppError(ErrorCodes.TOPIC_NOT_FOUND, 404, 'Topic not found');
    }
    return topic;
  }

  /**
   * Create a new topic. Auto-generates slug from name if not provided;
   * appends counter on conflict.
   */
  async adminCreate(dto: CreateTopicDto) {
    const baseSlug = dto.slug ?? slugify(dto.name);
    const slug = await uniqueSlug(baseSlug, (s) =>
      this.prisma.topic.findUnique({ where: { slug: s } }).then(Boolean),
    );

    return this.prisma.topic.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        thumbnail: dto.thumbnail ?? null,
        displayOrder: dto.displayOrder ?? 0,
        status: dto.status ?? ActiveStatus.ACTIVE,
      },
    });
  }

  /**
   * Update a topic by ID.
   * If slug is explicitly provided and differs from the current one,
   * validates uniqueness first.
   */
  async adminUpdate(id: string, dto: UpdateTopicDto) {
    const existing = await this.adminFindOne(id); // throws 404 if not found

    let slug = existing.slug;

    if (dto.slug && dto.slug !== existing.slug) {
      // Explicit slug change — check uniqueness
      const conflict = await this.prisma.topic.findUnique({
        where: { slug: dto.slug },
      });
      if (conflict) {
        throw new AppError(ErrorCodes.SLUG_TAKEN, 409, 'Slug is already taken');
      }
      slug = dto.slug;
    } else if (dto.name && dto.name !== existing.name && !dto.slug) {
      // Name changed but slug not explicitly set — regenerate
      const baseSlug = slugify(dto.name);
      slug = await uniqueSlug(baseSlug, (s) =>
        this.prisma.topic
          .findFirst({ where: { slug: s, NOT: { id } } })
          .then(Boolean),
      );
    }

    return this.prisma.topic.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        slug,
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.thumbnail !== undefined ? { thumbnail: dto.thumbnail } : {}),
        ...(dto.displayOrder !== undefined
          ? { displayOrder: dto.displayOrder }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  /**
   * Delete a topic by ID (hard delete — safe since lessons use junction table).
   */
  async adminDelete(id: string) {
    await this.adminFindOne(id); // throws 404 if not found
    await this.prisma.topic.delete({ where: { id } });
  }
}
