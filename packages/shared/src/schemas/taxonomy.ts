import { z } from 'zod';
import { ActiveStatus } from '../enums';
import { PaginationSchema } from './common';

// ---- Topic ----
export const CreateTopicSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase kebab-case').optional(),
  description: z.string().max(1000).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  displayOrder: z.number().int().default(0),
  status: z.nativeEnum(ActiveStatus).default(ActiveStatus.ACTIVE),
});
export type CreateTopicDto = z.infer<typeof CreateTopicSchema>;
export const UpdateTopicSchema = CreateTopicSchema.partial();
export type UpdateTopicDto = z.infer<typeof UpdateTopicSchema>;

// ---- Period ----
export const CreatePeriodSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional().nullable(),
  startYear: z.number().int().optional().nullable(),
  endYear: z.number().int().optional().nullable(),
  displayOrder: z.number().int().default(0),
  status: z.nativeEnum(ActiveStatus).default(ActiveStatus.ACTIVE),
});
export type CreatePeriodDto = z.infer<typeof CreatePeriodSchema>;
export const UpdatePeriodSchema = CreatePeriodSchema.partial();
export type UpdatePeriodDto = z.infer<typeof UpdatePeriodSchema>;

// ---- Character ----
export const CreateCharacterSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  avatar: z.string().url().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  biography: z.string().optional().nullable(),
  birthYear: z.number().int().optional().nullable(),
  deathYear: z.number().int().optional().nullable(),
  status: z.nativeEnum(ActiveStatus).default(ActiveStatus.ACTIVE),
});
export type CreateCharacterDto = z.infer<typeof CreateCharacterSchema>;
export const UpdateCharacterSchema = CreateCharacterSchema.partial();
export type UpdateCharacterDto = z.infer<typeof UpdateCharacterSchema>;

// ---- Event ----
export const CreateEventSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  status: z.nativeEnum(ActiveStatus).default(ActiveStatus.ACTIVE),
});
export type CreateEventDto = z.infer<typeof CreateEventSchema>;
export const UpdateEventSchema = CreateEventSchema.partial();
export type UpdateEventDto = z.infer<typeof UpdateEventSchema>;

// ---- List query ----
export const TaxonomyListQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(ActiveStatus).optional(),
});
export type TaxonomyListQueryDto = z.infer<typeof TaxonomyListQuerySchema>;
