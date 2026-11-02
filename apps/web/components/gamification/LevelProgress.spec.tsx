import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LevelProgress } from './LevelProgress';
import type { UserLevelProgressDto } from '@history-learning/shared';

const mockLevelStudent: UserLevelProgressDto = {
  currentLevel: { id: 'lvl-2', name: 'Học trò', displayOrder: 2, requiredExp: 100 },
  nextLevel: { id: 'lvl-3', name: 'Học giả', displayOrder: 3, requiredExp: 250 },
  totalExp: 150,
  expInCurrentLevel: 50,
  expNeededForNextLevel: 150,
  expRemaining: 100,
  progressPercentage: 33,
  isMaxLevel: false,
};

const mockLevelMax: UserLevelProgressDto = {
  currentLevel: { id: 'lvl-5', name: 'Sử gia', displayOrder: 5, requiredExp: 1000 },
  nextLevel: null,
  totalExp: 1200,
  expInCurrentLevel: 200,
  expNeededForNextLevel: 0,
  expRemaining: 0,
  progressPercentage: 100,
  isMaxLevel: true,
};

const mockLevelBeginner: UserLevelProgressDto = {
  currentLevel: { id: 'lvl-1', name: 'Tân sinh', displayOrder: 1, requiredExp: 0 },
  nextLevel: { id: 'lvl-2', name: 'Học trò', displayOrder: 2, requiredExp: 100 },
  totalExp: 50,
  expInCurrentLevel: 50,
  expNeededForNextLevel: 100,
  expRemaining: 50,
  progressPercentage: 50,
  isMaxLevel: false,
};

describe('LevelProgress Component', () => {
  it('render null khi level là undefined hoặc null', () => {
    const html = renderToStaticMarkup(<LevelProgress level={null} />);
    expect(html).toBe('');
  });

  describe('Card Variant (Mặc định)', () => {
    it('hiển thị đầy đủ thông tin: Tên level, EXP, thanh tiến trình và mốc kế tiếp', () => {
      const html = renderToStaticMarkup(<LevelProgress level={mockLevelStudent} variant="card" />);
      expect(html).toContain('Cấp 2: Học trò');
      expect(html).toContain('150 EXP');
      expect(html).toContain('Cần thêm');
      expect(html).toContain('100 EXP');
      expect(html).toContain('Học giả');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="33"');
    });

    it('hiển thị đúng trạng thái đã đạt Level tối đa khi isMaxLevel = true', () => {
      const html = renderToStaticMarkup(<LevelProgress level={mockLevelMax} variant="card" />);
      expect(html).toContain('Cấp 5: Sử gia');
      expect(html).toContain('1.200 EXP');
      expect(html).toContain('Đã đạt cấp độ vinh dự cao nhất: Sử gia');
      expect(html).toContain('aria-valuenow="100"');
      expect(html).not.toContain('Cần thêm');
    });
  });

  describe('Compact Variant', () => {
    it('kết xuất đúng cấu trúc gọn cho Dropdown / Mobile', () => {
      const html = renderToStaticMarkup(<LevelProgress level={mockLevelBeginner} variant="compact" />);
      expect(html).toContain('Cấp 1: Tân sinh');
      expect(html).toContain('50 EXP');
      expect(html).toContain('Cần thêm +50 EXP');
      expect(html).toContain('Học trò');
    });

    it('hiển thị "Đã đạt cấp tối đa" trong phiên bản compact', () => {
      const html = renderToStaticMarkup(<LevelProgress level={mockLevelMax} variant="compact" />);
      expect(html).toContain('Cấp 5: Sử gia');
      expect(html).toContain('Đã đạt cấp tối đa');
    });
  });
});
