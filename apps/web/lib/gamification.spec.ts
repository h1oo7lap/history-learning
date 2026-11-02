import { describe, it, expect } from 'vitest';
import { computeLevelProgress } from './gamification';
import type { GamificationRewardLevelDto } from '@history-learning/shared';

const mockLevels: GamificationRewardLevelDto[] = [
  { id: 'lvl-1', name: 'Tân sinh', requiredExp: 0, displayOrder: 1 },
  { id: 'lvl-2', name: 'Học trò', requiredExp: 100, displayOrder: 2 },
  { id: 'lvl-3', name: 'Học giả', requiredExp: 250, displayOrder: 3 },
  { id: 'lvl-4', name: 'Hiền tài', requiredExp: 500, displayOrder: 4 },
  { id: 'lvl-5', name: 'Sử gia', requiredExp: 1000, displayOrder: 5 },
];

describe('computeLevelProgress', () => {
  it('xử lý EXP = 0: Cấp 1 Tân sinh, cần 100 EXP để lên Học trò (0%)', () => {
    const res = computeLevelProgress(0, mockLevels);
    expect(res.currentLevel.name).toBe('Tân sinh');
    expect(res.currentLevel.displayOrder).toBe(1);
    expect(res.nextLevel?.name).toBe('Học trò');
    expect(res.expInCurrentLevel).toBe(0);
    expect(res.expNeededForNextLevel).toBe(100);
    expect(res.expRemaining).toBe(100);
    expect(res.progressPercentage).toBe(0);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý EXP = 50: Cấp 1 Tân sinh, cần thêm 50 EXP (50%)', () => {
    const res = computeLevelProgress(50, mockLevels);
    expect(res.currentLevel.name).toBe('Tân sinh');
    expect(res.expInCurrentLevel).toBe(50);
    expect(res.expRemaining).toBe(50);
    expect(res.progressPercentage).toBe(50);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý đúng mốc: EXP = 100: Cấp 2 Học trò (100 EXP), tiếp theo là Học giả (250 EXP)', () => {
    const res = computeLevelProgress(100, mockLevels);
    expect(res.currentLevel.name).toBe('Học trò');
    expect(res.currentLevel.displayOrder).toBe(2);
    expect(res.nextLevel?.name).toBe('Học giả');
    expect(res.expInCurrentLevel).toBe(0);
    expect(res.expNeededForNextLevel).toBe(150);
    expect(res.expRemaining).toBe(150);
    expect(res.progressPercentage).toBe(0);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý giữa hai mốc: EXP = 200: Cấp 2 Học trò, đã tích lũy 100/150 EXP (67%)', () => {
    const res = computeLevelProgress(200, mockLevels);
    expect(res.currentLevel.name).toBe('Học trò');
    expect(res.expInCurrentLevel).toBe(100);
    expect(res.expRemaining).toBe(50);
    expect(res.progressPercentage).toBe(67);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý đúng mốc: EXP = 500: Cấp 4 Hiền tài, tiếp theo là Sử gia (1000 EXP)', () => {
    const res = computeLevelProgress(500, mockLevels);
    expect(res.currentLevel.name).toBe('Hiền tài');
    expect(res.currentLevel.displayOrder).toBe(4);
    expect(res.nextLevel?.name).toBe('Sử gia');
    expect(res.expRemaining).toBe(500);
    expect(res.progressPercentage).toBe(0);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý đúng mốc tối đa: EXP = 1000: Cấp 5 Sử gia (mức tối đa), isMaxLevel = true (100%)', () => {
    const res = computeLevelProgress(1000, mockLevels);
    expect(res.currentLevel.name).toBe('Sử gia');
    expect(res.currentLevel.displayOrder).toBe(5);
    expect(res.nextLevel).toBeNull();
    expect(res.expRemaining).toBe(0);
    expect(res.progressPercentage).toBe(100);
    expect(res.isMaxLevel).toBe(true);
  });

  it('xử lý vượt mốc tối đa: EXP > 1000 (2500): vẫn giữ Sử gia, isMaxLevel = true', () => {
    const res = computeLevelProgress(2500, mockLevels);
    expect(res.currentLevel.name).toBe('Sử gia');
    expect(res.nextLevel).toBeNull();
    expect(res.isMaxLevel).toBe(true);
    expect(res.progressPercentage).toBe(100);
  });

  it('xử lý số âm hoặc không hợp lệ: tự động đưa về 0', () => {
    const res = computeLevelProgress(-20, mockLevels);
    expect(res.currentLevel.name).toBe('Tân sinh');
    expect(res.totalExp).toBe(0);
    expect(res.progressPercentage).toBe(0);
  });

  it('xử lý danh sách level rỗng: fallback an toàn', () => {
    const res = computeLevelProgress(100, []);
    expect(res.currentLevel.name).toBe('Tân sinh');
    expect(res.isMaxLevel).toBe(true);
  });
});
