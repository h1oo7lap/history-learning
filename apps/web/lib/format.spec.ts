import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatNumber, formatTime, truncate, formatDate, formatRelativeTime } from './format';

describe('format utilities', () => {
  describe('formatNumber', () => {
    it('formats numbers with Vietnamese locale', () => {
      const res = formatNumber(1000000);
      expect(res).toBeTruthy();
    });
  });

  describe('formatTime', () => {
    it('formats minutes under 60', () => {
      expect(formatTime(45)).toBe('45 phút');
    });

    it('formats whole hours', () => {
      expect(formatTime(120)).toBe('2 giờ');
    });

    it('formats hours and minutes', () => {
      expect(formatTime(150)).toBe('2 giờ 30 phút');
    });
  });

  describe('truncate', () => {
    it('leaves strings shorter than max untouched', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('truncates longer strings and appends ellipsis', () => {
      expect(truncate('Hello World', 6)).toBe('Hello…');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const formatted = formatDate('2026-05-15T10:00:00.000Z');
      expect(formatted).toContain('2026');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "vừa xong" for differences under 1 minute', () => {
      expect(formatRelativeTime('2026-05-15T11:59:30.000Z')).toBe('vừa xong');
    });
  });
});
