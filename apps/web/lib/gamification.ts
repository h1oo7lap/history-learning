import { LEVELS, type LevelConfig } from '@history-learning/shared';

export interface UserLevelProgress {
  currentLevel: LevelConfig;
  nextLevel: LevelConfig | null;
  totalExp: number;
  expInCurrentLevel: number;
  expNeededForNextLevel: number;
  expRemaining: number;
  progressPercentage: number;
  isMaxLevel: boolean;
}

/**
 * Tính toán cấp độ hiện tại, cấp độ tiếp theo và tiến trình EXP của người dùng.
 * Quy tắc:
 * - Cấp 1: Tân sinh (0 EXP)
 * - Cấp 2: Học trò (100 EXP)
 * - Cấp 3: Học giả (250 EXP)
 * - Cấp 4: Hiền tài (500 EXP)
 * - Cấp 5: Sử gia (1000 EXP)
 */
export function getUserLevelProgress(totalExp: number = 0): UserLevelProgress {
  const safeExp = Math.max(0, Math.floor(totalExp));
  let currentIndex = 0;

  for (let i = 0; i < LEVELS.length; i++) {
    if (safeExp >= LEVELS[i]!.requiredExp) {
      currentIndex = i;
    } else {
      break;
    }
  }

  const currentLevel = LEVELS[currentIndex]!;
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1]! : null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      totalExp: safeExp,
      expInCurrentLevel: safeExp - currentLevel.requiredExp,
      expNeededForNextLevel: 0,
      expRemaining: 0,
      progressPercentage: 100,
      isMaxLevel: true,
    };
  }

  const expInCurrentLevel = safeExp - currentLevel.requiredExp;
  const expNeededForNextLevel = nextLevel.requiredExp - currentLevel.requiredExp;
  const expRemaining = Math.max(0, nextLevel.requiredExp - safeExp);
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((expInCurrentLevel / expNeededForNextLevel) * 100))
  );

  return {
    currentLevel,
    nextLevel,
    totalExp: safeExp,
    expInCurrentLevel,
    expNeededForNextLevel,
    expRemaining,
    progressPercentage,
    isMaxLevel: false,
  };
}

