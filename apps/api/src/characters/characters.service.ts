import { Injectable } from '@nestjs/common';
import { ActiveStatus } from '@history-learning/shared';
import type {
  CreateCharacterDto,
  UpdateCharacterDto,
  TaxonomyListQueryDto,
} from '@history-learning/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { paginate, getPaginationArgs } from '../common/pagination/paginate';
import { slugify, uniqueSlug } from '../common/utils/slugify';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Public helpers
  // ---------------------------------------------------------------------------

  /**
   * Public list — only ACTIVE characters.
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
      this.prisma.historicalCharacter.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
          shortDescription: true,
          birthYear: true,
          deathYear: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.historicalCharacter.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  /**
   * Get a single active character by slug (public).
   */
  async findOneBySlug(slug: string) {
    const character = await this.prisma.historicalCharacter.findFirst({
      where: { slug, status: ActiveStatus.ACTIVE },
    });
    if (!character) {
      throw new AppError(
        ErrorCodes.CHARACTER_NOT_FOUND,
        404,
        'Character not found',
      );
    }
    return character;
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
      this.prisma.historicalCharacter.findMany({
        where,
        orderBy: [{ name: 'asc' }],
        skip,
        take,
      }),
      this.prisma.historicalCharacter.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  /**
   * Get a single character by ID (admin).
   */
  async adminFindOne(id: string) {
    const character = await this.prisma.historicalCharacter.findUnique({
      where: { id },
    });
    if (!character) {
      throw new AppError(
        ErrorCodes.CHARACTER_NOT_FOUND,
        404,
        'Character not found',
      );
    }
    return character;
  }

  /**
   * Create a new character. Auto-generates slug from name if not provided;
   * appends counter on conflict.
   */
  async adminCreate(dto: CreateCharacterDto) {
    const baseSlug = dto.slug ?? slugify(dto.name);
    const slug = await uniqueSlug(baseSlug, (s) =>
      this.prisma.historicalCharacter
        .findUnique({ where: { slug: s } })
        .then(Boolean),
    );

    return this.prisma.historicalCharacter.create({
      data: {
        name: dto.name,
        slug,
        avatar: dto.avatar ?? null,
        shortDescription: dto.shortDescription ?? null,
        biography: dto.biography ?? null,
        birthYear: dto.birthYear ?? null,
        deathYear: dto.deathYear ?? null,
        status: dto.status ?? ActiveStatus.ACTIVE,
      },
    });
  }

  /**
   * Update a character by ID.
   * If slug is explicitly provided and differs from the current one,
   * validates uniqueness first.
   */
  async adminUpdate(id: string, dto: UpdateCharacterDto) {
    const existing = await this.adminFindOne(id); // throws 404 if not found

    let slug = existing.slug;

    if (dto.slug && dto.slug !== existing.slug) {
      // Explicit slug change — check uniqueness
      const conflict = await this.prisma.historicalCharacter.findUnique({
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
        this.prisma.historicalCharacter
          .findFirst({ where: { slug: s, NOT: { id } } })
          .then(Boolean),
      );
    }

    return this.prisma.historicalCharacter.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        slug,
        ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
        ...(dto.shortDescription !== undefined
          ? { shortDescription: dto.shortDescription }
          : {}),
        ...(dto.biography !== undefined ? { biography: dto.biography } : {}),
        ...(dto.birthYear !== undefined ? { birthYear: dto.birthYear } : {}),
        ...(dto.deathYear !== undefined ? { deathYear: dto.deathYear } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  /**
   * Soft-delete a character by setting status to INACTIVE.
   */
  async adminDelete(id: string) {
    await this.adminFindOne(id); // throws 404 if not found
    await this.prisma.historicalCharacter.update({
      where: { id },
      data: { status: ActiveStatus.INACTIVE },
    });
  }
}
