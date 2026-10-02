import { describe, it, expect } from 'vitest';
import { paginate, getPaginationArgs } from './paginate';

describe('paginate()', () => {
  it('wraps items with correct metadata', () => {
    const items = [{ id: '1' }, { id: '2' }];
    const result = paginate(items, 25, { page: 2, pageSize: 10 });

    expect(result).toEqual({
      items,
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('calculates totalPages = 1 when total equals pageSize', () => {
    const result = paginate([], 10, { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(1);
  });

  it('rounds totalPages up (ceil)', () => {
    const result = paginate([], 11, { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(2);
  });

  it('returns totalPages = 0 when total = 0', () => {
    const result = paginate([], 0, { page: 1, pageSize: 20 });
    expect(result.totalPages).toBe(0);
    expect(result.total).toBe(0);
  });

  it('preserves page and pageSize in output', () => {
    const result = paginate(['a', 'b', 'c'], 3, { page: 1, pageSize: 20 });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.items).toHaveLength(3);
  });
});

describe('getPaginationArgs()', () => {
  it('computes skip = (page - 1) * pageSize', () => {
    const { skip, take } = getPaginationArgs({ page: 3, pageSize: 10 });
    expect(skip).toBe(20);
    expect(take).toBe(10);
  });

  it('clamps page to minimum 1', () => {
    const { page, skip } = getPaginationArgs({ page: 0, pageSize: 10 });
    expect(page).toBe(1);
    expect(skip).toBe(0);
  });

  it('clamps pageSize to MAX_PAGE_SIZE', () => {
    // MAX_PAGE_SIZE is 100 per shared constants
    const { pageSize } = getPaginationArgs({ page: 1, pageSize: 9999 });
    expect(pageSize).toBeLessThanOrEqual(100);
  });

  it('returns correct page and pageSize in output', () => {
    const args = getPaginationArgs({ page: 5, pageSize: 20 });
    expect(args.page).toBe(5);
    expect(args.pageSize).toBe(20);
    expect(args.skip).toBe(80);
    expect(args.take).toBe(20);
  });
});
