import { z } from 'zod';
import { AUTH } from '../constants';

export const RegisterSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(AUTH.PASSWORD_MIN).max(AUTH.PASSWORD_MAX),
  fullName: z.string().min(AUTH.FULL_NAME_MIN).max(AUTH.FULL_NAME_MAX).trim(),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(AUTH.PASSWORD_MAX),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(AUTH.PASSWORD_MIN).max(AUTH.PASSWORD_MAX),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
