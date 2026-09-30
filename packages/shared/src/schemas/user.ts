import { z } from 'zod';
import { AUTH } from '../constants';

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(AUTH.FULL_NAME_MIN).max(AUTH.FULL_NAME_MAX).trim().optional(),
  avatar: z.string().url().optional().nullable(),
  gradeId: z.string().optional().nullable(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
