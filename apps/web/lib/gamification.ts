import type {
  UserLevelProgressDto,
  GamificationRewardLevelDto,
} from '@history-learning/shared';

export type { UserLevelProgressDto, GamificationRewardLevelDto };

/**
 * Tính toán cấp độ hiện tại, cấp độ tiếp theo và tiến trình EXP
 * từ danh sách Level do backend/database cung cấp.
 * Hàm thuần túy, KHÔNG hard-code bất kỳ mốc EXP hay danh sách Level nào.
 */
export function computeLevelProgress(
  totalExp: number = 0,
  levels: GamificationRewardLevelDto[] = [],
): UserLevelProgressDto {
  const safeExp = Math.max(0, Math.floor(totalExp));

  if (!levels || levels.length === 0) {
    const defaultLevel: GamificationRewardLevelDto = {
      id: 'default',
      name: 'Tân sinh',
      requiredExp: 0,
      displayOrder: 1,
    };
    return {
      currentLevel: defaultLevel,
      nextLevel: null,
      totalExp: safeExp,
      expInCurrentLevel: safeExp,
      expNeededForNextLevel: 0,
      expRemaining: 0,
      progressPercentage: 100,
      isMaxLevel: true,
    };
  }

  const sorted = [...levels].sort((a, b) => a.requiredExp - b.requiredExp);

  let currentIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (safeExp >= sorted[i]!.requiredExp) {
      currentIndex = i;
    } else {
      break;
    }
  }

  const currentLevel = sorted[currentIndex]!;
  const nextLevel = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1]! : null;

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
    Math.max(0, Math.round((expInCurrentLevel / expNeededForNextLevel) * 100)),
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
