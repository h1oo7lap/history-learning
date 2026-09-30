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
