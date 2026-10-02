import { PAGINATION } from '@history-learning/shared';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Wraps a list of items with full pagination metadata.
 * Use together with getPaginationArgs() to compute skip/take,
 * then pass the total count and fetched items here.
 */
export function paginate<T>(
  items: T[],
  total: number,
  { page, pageSize }: PaginationParams,
): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Returns Prisma-compatible skip/take args from validated pagination params.
 * Clamps pageSize to the configured maximum and ensures page >= 1.
 */
export function getPaginationArgs(params: PaginationParams) {
  const pageSize = Math.min(
    params.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE,
    PAGINATION.MAX_PAGE_SIZE,
  );
  const page = Math.max(params.page ?? 1, 1);
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}
