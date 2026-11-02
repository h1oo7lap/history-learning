import { describe, it, expect } from 'vitest';
import { getUserLevelProgress } from './gamification';

describe('getUserLevelProgress', () => {
  it('xử lý EXP = 0: Cấp 1 Tân sinh, cần 100 EXP để lên Học trò (0%)', () => {
    const res = getUserLevelProgress(0);
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
    const res = getUserLevelProgress(50);
    expect(res.currentLevel.name).toBe('Tân sinh');
    expect(res.expInCurrentLevel).toBe(50);
    expect(res.expRemaining).toBe(50);
    expect(res.progressPercentage).toBe(50);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý EXP = 100: Cấp 2 Học trò (100 EXP), tiếp theo là Học giả (250 EXP)', () => {
    const res = getUserLevelProgress(100);
    expect(res.currentLevel.name).toBe('Học trò');
    expect(res.currentLevel.displayOrder).toBe(2);
    expect(res.nextLevel?.name).toBe('Học giả');
    expect(res.expInCurrentLevel).toBe(0);
    expect(res.expNeededForNextLevel).toBe(150);
    expect(res.expRemaining).toBe(150);
    expect(res.progressPercentage).toBe(0);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý EXP = 200: Cấp 2 Học trò, đã tích lũy 100/150 EXP (67%)', () => {
    const res = getUserLevelProgress(200);
    expect(res.currentLevel.name).toBe('Học trò');
    expect(res.expInCurrentLevel).toBe(100);
    expect(res.expRemaining).toBe(50);
    expect(res.progressPercentage).toBe(67);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý EXP = 500: Cấp 4 Hiền tài, tiếp theo là Sử gia (1000 EXP)', () => {
    const res = getUserLevelProgress(500);
    expect(res.currentLevel.name).toBe('Hiền tài');
    expect(res.currentLevel.displayOrder).toBe(4);
    expect(res.nextLevel?.name).toBe('Sử gia');
    expect(res.expRemaining).toBe(500);
    expect(res.progressPercentage).toBe(0);
    expect(res.isMaxLevel).toBe(false);
  });

  it('xử lý EXP = 1000: Cấp 5 Sử gia (mức tối đa), isMaxLevel = true (100%)', () => {
    const res = getUserLevelProgress(1000);
    expect(res.currentLevel.name).toBe('Sử gia');
    expect(res.currentLevel.displayOrder).toBe(5);
    expect(res.nextLevel).toBeNull();
    expect(res.expRemaining).toBe(0);
    expect(res.progressPercentage).toBe(100);
    expect(res.isMaxLevel).toBe(true);
  });

  it('xử lý EXP > 1000 (vượt mốc tối đa): vẫn giữ Sử gia, isMaxLevel = true', () => {
    const res = getUserLevelProgress(2500);
    expect(res.currentLevel.name).toBe('Sử gia');
    expect(res.nextLevel).toBeNull();
    expect(res.isMaxLevel).toBe(true);
    expect(res.progressPercentage).toBe(100);
  });

  it('xử lý số âm hoặc không hợp lệ: tự động đưa về 0', () => {
    const res = getUserLevelProgress(-20);
    expect(res.currentLevel.name).toBe('Tân sinh');
    expect(res.totalExp).toBe(0);
    expect(res.progressPercentage).toBe(0);
  });
});

