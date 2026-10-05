import { describe, it, expect } from 'vitest';
import { slugify, uniqueSlug } from './slugify';

describe('slugify()', () => {
  it('converts basic text to kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips Vietnamese diacritics', () => {
    expect(slugify('Trần Hưng Đạo')).toBe('tran-hung-dao');
  });

  it('handles đ and Đ correctly', () => {
    expect(slugify('Đại Việt')).toBe('dai-viet');
    expect(slugify('đồng bằng')).toBe('dong-bang');
  });

  it('removes special characters', () => {
    expect(slugify('Hello! @World #2024')).toBe('hello-world-2024');
  });

  it('collapses multiple hyphens into one', () => {
    expect(slugify('a - - b')).toBe('a-b');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  --hello-- ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles fully numeric input', () => {
    expect(slugify('1945')).toBe('1945');
  });

  it('strips underscores (they are non-alphanumeric)', () => {
    // underscores are removed by the [^a-z0-9\s-] regex
    expect(slugify('some_thing_here')).toBe('somethinghere');
  });

  it('handles complex Vietnamese sentence', () => {
    expect(slugify('Chiến thắng Bạch Đằng')).toBe('chien-thang-bach-dang');
  });

  it('handles mixed-case with numbers', () => {
    expect(slugify('Lớp 7 Bài 3')).toBe('lop-7-bai-3');
  });
});

describe('uniqueSlug()', () => {
  it('returns base slug when not taken', async () => {
    const slug = await uniqueSlug('hello-world', async () => false);
    expect(slug).toBe('hello-world');
  });

  it('appends -1 when base slug is taken', async () => {
    const taken = new Set(['hello-world']);
    const slug = await uniqueSlug('hello-world', async (s) => taken.has(s));
    expect(slug).toBe('hello-world-1');
  });

  it('increments counter until a free slug is found', async () => {
    const taken = new Set(['my-slug', 'my-slug-1', 'my-slug-2']);
    const slug = await uniqueSlug('my-slug', async (s) => taken.has(s));
    expect(slug).toBe('my-slug-3');
  });

  it('slugifies the base before checking', async () => {
    // If the base has Vietnamese characters, it should be slugified first
    const slug = await uniqueSlug('Đại Việt', async () => false);
    expect(slug).toBe('dai-viet');
  });

  it('slugifies the base on each counter iteration', async () => {
    const taken = new Set(['dai-viet']);
    const slug = await uniqueSlug('Đại Việt', async (s) => taken.has(s));
    expect(slug).toBe('dai-viet-1');
  });
});
