import { z } from 'zod';
import { ActiveStatus, CardRarity, CardType, CardUnlockType, MissionType } from '../enums';

// ---- Mission ----
export const CreateMissionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.nativeEnum(MissionType),
  target: z.number().int().positive(),
  rewardExp: z.number().int().min(0).default(50),
  rewardCardId: z.string().optional().nullable(),
  status: z.nativeEnum(ActiveStatus).default(ActiveStatus.ACTIVE),
});
export type CreateMissionDto = z.infer<typeof CreateMissionSchema>;
export const UpdateMissionSchema = CreateMissionSchema.partial();
export type UpdateMissionDto = z.infer<typeof UpdateMissionSchema>;

// ---- History Card ----
export const CreateCardSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  type: z.nativeEnum(CardType),
  rarity: z.nativeEnum(CardRarity).default(CardRarity.COMMON),
  image: z.string().url().optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  periodId: z.string().optional().nullable(),
  unlockType: z.nativeEnum(CardUnlockType).default(CardUnlockType.NONE),
  unlockRefId: z.string().optional().nullable(),
  status: z.nativeEnum(ActiveStatus).default(ActiveStatus.ACTIVE),
});
export type CreateCardDto = z.infer<typeof CreateCardSchema>;
export const UpdateCardSchema = CreateCardSchema.partial();
export type UpdateCardDto = z.infer<typeof UpdateCardSchema>;

// ---- Gamification Reward Result Schemas ----
export const GamificationRewardLevelSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayOrder: z.number(),
  requiredExp: z.number(),
});
export type GamificationRewardLevelDto = z.infer<typeof GamificationRewardLevelSchema>;

export const UnlockedCardItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type UnlockedCardItemDto = z.infer<typeof UnlockedCardItemSchema>;

export const LessonRewardResultSchema = z.object({
  expGained: z.number(),
  totalExp: z.number(),
  leveledUp: z.boolean(),
  currentLevel: GamificationRewardLevelSchema,
  unlockedCharacters: z.array(UnlockedCardItemSchema),
  unlockedEvents: z.array(UnlockedCardItemSchema),
});
export type LessonRewardResultDto = z.infer<typeof LessonRewardResultSchema>;

export const QuizRewardResultSchema = z.object({
  expGained: z.number(),
  totalExp: z.number(),
  leveledUp: z.boolean(),
  currentLevel: GamificationRewardLevelSchema,
});
export type QuizRewardResultDto = z.infer<typeof QuizRewardResultSchema>;

// ---- User Level Progress Schema (Dữ liệu tính từ bảng Level trong database) ----
export const UserLevelProgressSchema = z.object({
  currentLevel: GamificationRewardLevelSchema,
  nextLevel: GamificationRewardLevelSchema.nullable(),
  totalExp: z.number(),
  expInCurrentLevel: z.number(),
  expNeededForNextLevel: z.number(),
  expRemaining: z.number(),
  progressPercentage: z.number(),
  isMaxLevel: z.boolean(),
});
export type UserLevelProgressDto = z.infer<typeof UserLevelProgressSchema>;

// ---- User Collection Schemas ----
export const UserCollectionCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  avatar: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  biography: z.string().nullable().optional(),
  birthYear: z.number().int().nullable().optional(),
  deathYear: z.number().int().nullable().optional(),
  unlockedAt: z.union([z.string(), z.date()]),
});
export type UserCollectionCharacterDto = z.infer<typeof UserCollectionCharacterSchema>;

export const UserCollectionEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  startDate: z.union([z.string(), z.date()]).nullable().optional(),
  endDate: z.union([z.string(), z.date()]).nullable().optional(),
  location: z.string().nullable().optional(),
  unlockedAt: z.union([z.string(), z.date()]),
});
export type UserCollectionEventDto = z.infer<typeof UserCollectionEventSchema>;

export const UserCollectionResponseSchema = z.object({
  characters: z.array(UserCollectionCharacterSchema),
  events: z.array(UserCollectionEventSchema),
  totalCharacters: z.number(),
  totalEvents: z.number(),
  totalCards: z.number(),
});
export type UserCollectionResponseDto = z.infer<typeof UserCollectionResponseSchema>;
