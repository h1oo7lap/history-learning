import { z } from 'zod';
import { AUTH } from '../constants';

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'Tên không được để trống').max(50, 'Tên tối đa 50 ký tự').optional(),
  lastName: z.string().trim().max(100, 'Họ và tên đệm tối đa 100 ký tự').optional(),
  fullName: z.string().min(AUTH.FULL_NAME_MIN).max(AUTH.FULL_NAME_MAX).trim().optional(),
  avatar: z.string().url().optional().nullable(),
  gradeId: z.string().optional().nullable(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
