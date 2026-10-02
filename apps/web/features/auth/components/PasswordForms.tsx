'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, KeyRound, History, ArrowLeft } from 'lucide-react';
import { ForgotPasswordSchema, ResetPasswordSchema } from '@history-learning/shared';
import type { ForgotPasswordDto } from '@history-learning/shared';
import { useForgotPassword, useResetPassword } from '@/features/auth/hooks';
import { z } from 'zod';

// ─── Forgot Password ──────────────────────────────────────────
export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordDto>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  return (
    <div className="auth-form-panel" style={{ minHeight: '100dvh' }}>
      <div className="auth-form-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <History size={22} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--foreground)' }}>
            Học Lịch Sử
          </span>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--brand-50)', border: '1.5px solid var(--brand-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <KeyRound size={26} color="var(--brand-500)" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, marginBottom: '0.375rem' }}>Quên mật khẩu?</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
          </p>
        </div>

        {forgotPassword.isSuccess ? (
          <div style={{
            padding: '1.25rem', borderRadius: 12,
            background: 'rgb(16 185 129 / 0.08)',
            border: '1.5px solid rgb(16 185 129 / 0.25)',
            textAlign: 'center',
            color: 'var(--success)',
          }}>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.375rem' }}>✉️ Email đã được gửi!</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(d => forgotPassword.mutate(d.email))} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label className="label" htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                className={`input${errors.email ? ' error' : ''}`}
                placeholder="email@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            <button
              id="forgot-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={forgotPassword.isPending}
            >
              {forgotPassword.isPending
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang gửi...</>
                : 'Gửi link đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '1.5rem', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Reset Password ───────────────────────────────────────────
const ResetFormSchema = ResetPasswordSchema.omit({ token: true }).extend({
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});
type ResetFormData = z.infer<typeof ResetFormSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const resetPassword = useResetPassword();

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormData>({
    resolver: zodResolver(ResetFormSchema),
  });

  if (!token) {
    return (
      <div className="auth-form-panel" style={{ minHeight: '100dvh' }}>
        <div className="auth-form-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Link không hợp lệ</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
          <Link href="/forgot-password" className="btn btn-primary btn-lg">
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-panel" style={{ minHeight: '100dvh' }}>
      <div className="auth-form-card">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, marginBottom: '0.375rem' }}>Đặt lại mật khẩu</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit(d => resetPassword.mutate({ token, password: d.password }))} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div>
            <label className="label" htmlFor="reset-password">Mật khẩu mới</label>
            <input
              id="reset-password"
              type="password"
              className={`input${errors.password ? ' error' : ''}`}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="reset-confirm-password">Xác nhận mật khẩu</label>
            <input
              id="reset-confirm-password"
              type="password"
              className={`input${errors.confirmPassword ? ' error' : ''}`}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
          </div>

          <button
            id="reset-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending
              ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang đặt lại...</>
              : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
