import { z } from 'zod';
import { AUTH } from '../constants';

export const PasswordSchema = z
  .string()
  .min(AUTH.PASSWORD_MIN, `Mật khẩu tối thiểu ${AUTH.PASSWORD_MIN} ký tự`)
  .max(AUTH.PASSWORD_MAX, `Mật khẩu tối đa ${AUTH.PASSWORD_MAX} ký tự`)
  .regex(/[A-Za-z]/, 'Mật khẩu cần có ít nhất một chữ cái')
  .regex(/\d/, 'Mật khẩu cần có ít nhất một chữ số');

export const RegisterSchema = z
  .object({
    email: z.string().trim().email('Email không hợp lệ').toLowerCase(),
    password: PasswordSchema,
    lastName: z
      .string()
      .trim()
      .max(100, 'Họ & tên đệm tối đa 100 ký tự')
      .optional(),
    firstName: z
      .string()
      .trim()
      .max(50, 'Tên tối đa 50 ký tự')
      .optional(),
    fullName: z
      .string()
      .trim()
      .min(AUTH.FULL_NAME_MIN, `Họ tên tối thiểu ${AUTH.FULL_NAME_MIN} ký tự`)
      .max(AUTH.FULL_NAME_MAX)
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Khi đăng ký qua form web (không gửi fullName), bắt buộc phải có cả Họ & tên đệm và Tên
    if (!data.fullName) {
      if (!data.lastName || data.lastName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập họ và tên đệm',
          path: ['lastName'],
        });
      }
      if (!data.firstName || data.firstName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập tên',
          path: ['firstName'],
        });
      }
    }
  });

export type RegisterDto = z.infer<typeof RegisterSchema>;

// Đăng nhập chỉ kiểm tra có gửi mật khẩu, không áp quy tắc mới,
// để tài khoản cũ có mật khẩu yếu vẫn đăng nhập được.
export const LoginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(AUTH.PASSWORD_MAX),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: PasswordSchema,
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
