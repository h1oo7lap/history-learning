import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatNumber,
  formatTime,
  truncate,
  formatDate,
  formatRelativeTime,
  formatDifficulty,
  formatGrade,
  optimizeCloudinaryUrl,
  formatProgressStatus,
} from './format';

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

  describe('formatDifficulty', () => {
    it('maps EASY, MEDIUM, HARD to Vietnamese labels', () => {
      expect(formatDifficulty('EASY')).toBe('Cơ bản');
      expect(formatDifficulty('MEDIUM')).toBe('Trung bình');
      expect(formatDifficulty('HARD')).toBe('Nâng cao');
    });

    it('handles undefined or null', () => {
      expect(formatDifficulty(undefined)).toBe('Chưa xác định');
      expect(formatDifficulty(null)).toBe('Chưa xác định');
    });
  });

  describe('formatGrade', () => {
    it('formats grade string and objects', () => {
      expect(formatGrade('GRADE_4')).toBe('Lớp 4');
      expect(formatGrade({ name: 'Lớp 10' })).toBe('Lớp 10');
      expect(formatGrade({ code: 'GRADE_12' })).toBe('Lớp 12');
    });
  });

  describe('optimizeCloudinaryUrl', () => {
    it('injects transformation into Cloudinary URLs', () => {
      const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      expect(optimizeCloudinaryUrl(url, 640)).toBe(
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/sample.jpg'
      );
    });

    it('leaves non-cloudinary URLs untouched', () => {
      const external = 'https://example.com/image.png';
      expect(optimizeCloudinaryUrl(external)).toBe(external);
    });
  });

  describe('formatProgressStatus', () => {
    it('maps IN_PROGRESS and COMPLETED to user-friendly Vietnamese labels', () => {
      expect(formatProgressStatus('IN_PROGRESS')).toBe('Đang học');
      expect(formatProgressStatus('COMPLETED')).toBe('Đã học');
      expect(formatProgressStatus('NOT_STARTED')).toBe('Chưa học');
    });

    it('handles empty or unknown status gracefully', () => {
      expect(formatProgressStatus(undefined)).toBe('');
      expect(formatProgressStatus(null)).toBe('');
      expect(formatProgressStatus('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});

