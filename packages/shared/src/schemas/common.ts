import { z } from 'zod';
import { PAGINATION } from '../constants';

// ---- Pagination ----
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
});
export type PaginationDto = z.infer<typeof PaginationSchema>;

// ---- ID param ----
export const IdParamSchema = z.object({
  id: z.string().min(1),
});
export type IdParamDto = z.infer<typeof IdParamSchema>;

// ---- Slug param ----
export const SlugParamSchema = z.object({
  slug: z.string().min(1),
});
export type SlugParamDto = z.infer<typeof SlugParamSchema>;

// ---- Standard search param ----
export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
});
export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;
