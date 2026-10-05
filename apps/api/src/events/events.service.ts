import { Injectable } from '@nestjs/common';
import { ActiveStatus } from '@history-learning/shared';
import type {
  CreateEventDto,
  UpdateEventDto,
  TaxonomyListQueryDto,
} from '@history-learning/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { paginate, getPaginationArgs } from '../common/pagination/paginate';
import { slugify, uniqueSlug } from '../common/utils/slugify';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public helpers
  // ---------------------------------------------------------------------------

  /**
   * Public list — only ACTIVE events.
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
      this.prisma.historicalEvent.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          startDate: true,
          endDate: true,
          location: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.historicalEvent.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  /**
   * Get a single active event by slug (public).
   */
  async findOneBySlug(slug: string) {
    const event = await this.prisma.historicalEvent.findFirst({
      where: { slug, status: ActiveStatus.ACTIVE },
    });
    if (!event) {
      throw new AppError(ErrorCodes.EVENT_NOT_FOUND, 404, 'Event not found');
    }
    return event;
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
      this.prisma.historicalEvent.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip,
        take,
      }),
      this.prisma.historicalEvent.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  /**
   * Get a single event by ID (admin).
   */
  async adminFindOne(id: string) {
    const event = await this.prisma.historicalEvent.findUnique({
      where: { id },
    });
    if (!event) {
      throw new AppError(ErrorCodes.EVENT_NOT_FOUND, 404, 'Event not found');
    }
    return event;
  }

  /**
   * Create a new event. Auto-generates slug from name if not provided;
   * appends counter on conflict.
   */
  async adminCreate(dto: CreateEventDto) {
    const baseSlug = dto.slug ?? slugify(dto.name);
    const slug = await uniqueSlug(baseSlug, (s) =>
      this.prisma.historicalEvent
        .findUnique({ where: { slug: s } })
        .then(Boolean),
    );

    return this.prisma.historicalEvent.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        location: dto.location ?? null,
        status: dto.status ?? ActiveStatus.ACTIVE,
      },
    });
  }

  /**
   * Update an event by ID.
   * If slug is explicitly provided and differs from the current one,
   * validates uniqueness first.
   */
  async adminUpdate(id: string, dto: UpdateEventDto) {
    const existing = await this.adminFindOne(id); // throws 404 if not found

    let slug = existing.slug;

    if (dto.slug && dto.slug !== existing.slug) {
      // Explicit slug change — check uniqueness
      const conflict = await this.prisma.historicalEvent.findUnique({
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
        this.prisma.historicalEvent
          .findFirst({ where: { slug: s, NOT: { id } } })
          .then(Boolean),
      );
    }

    return this.prisma.historicalEvent.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        slug,
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  /**
   * Soft-delete an event by setting status to INACTIVE.
   */
  async adminDelete(id: string) {
    await this.adminFindOne(id); // throws 404 if not found
    await this.prisma.historicalEvent.update({
      where: { id },
      data: { status: ActiveStatus.INACTIVE },
    });
  }
}
