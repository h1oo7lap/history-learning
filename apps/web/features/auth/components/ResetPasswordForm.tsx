'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { ResetPasswordSchema } from '@history-learning/shared';
import { Button } from '@/components/ui/Button';
import { useResetPassword } from '@/features/auth/hooks';
import { AuthLogo, AuthShell } from './AuthShell';
import { PasswordField } from './PasswordField';
import { PasswordStrength } from './RegisterForm';

const ResetFormSchema = ResetPasswordSchema.omit({ token: true }).extend({
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});
type ResetFormData = z.infer<typeof ResetFormSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const resetPassword = useResetPassword();
  const [watchedPassword, setWatchedPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(ResetFormSchema),
  });

  const password = watch('password', '');

  if (!token) {
    return (
      <AuthShell cardStyle={{ textAlign: 'center' }}>
        <AuthLogo center />
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.375rem' }}>
          Liên kết không hợp lệ
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href="/forgot-password" style={{ textDecoration: 'none' }}>
            Yêu cầu link mới
          </Link>
        </Button>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
          <Link
            href="/login"
            style={{ color: 'var(--brand-500)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Nhập mật khẩu mới cho tài khoản của bạn"
    >
      <form
        onSubmit={handleSubmit((d) => resetPassword.mutate({ token, password: d.password }))}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
      >
        <PasswordField
          id="reset-password"
          label="Mật khẩu mới"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', { onChange: (e) => setWatchedPassword(e.target.value) })}
        >
          {(watchedPassword || password) ? <PasswordStrength password={watchedPassword || password} /> : null}
        </PasswordField>

        <PasswordField
          id="reset-confirm-password"
          label="Xác nhận mật khẩu"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          id="reset-submit-btn"
          type="submit"
          size="lg"
          loading={resetPassword.isPending}
          className="w-full mt-2"
        >
          {resetPassword.isPending ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
        </Button>
      </form>

      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
        <Link
          href="/login"
          style={{ color: 'var(--brand-500)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
