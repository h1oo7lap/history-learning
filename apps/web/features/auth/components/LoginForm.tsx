'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

import { LoginSchema } from '@history-learning/shared';
import type { LoginDto } from '@history-learning/shared';
import { Button } from '@/components/ui/Button';
import { useLogin, authKeys } from '../hooks';
import { AuthShell } from './AuthShell';
import { PasswordField } from './PasswordField';

export { AuthHeroContent } from './AuthHero';

export function LoginForm() {
  const queryClient = useQueryClient();
  const login = useLogin();

  // Clear stale auth cache when the login page mounts so a previously
  // logged-in user's data doesn't auto-redirect without fresh credentials.
  useEffect(() => {
    queryClient.removeQueries({ queryKey: authKeys.me });
  }, [queryClient]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = (data: LoginDto) => {
    login.mutate(data);
  };

  return (
    <AuthShell
      title="Chào mừng trở lại"
      description="Đăng nhập để tiếp tục hành trình khám phá lịch sử"
    >
      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
      >
        {/* Email */}
        <div>
          <label className="label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className={`input${errors.email ? ' error' : ''}`}
            placeholder="email@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <PasswordField
          id="login-password"
          label="Mật khẩu"
          labelRight={
            <Link
              href="/forgot-password"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--brand-500)',
                textDecoration: 'none',
              }}
            >
              Quên mật khẩu?
            </Link>
          }
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Submit */}
        <Button
          id="login-submit-btn"
          type="submit"
          size="lg"
          loading={login.isPending}
          className="w-full mt-2"
        >
          {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      {/* Footer */}
      <p
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--muted)',
        }}
      >
        Chưa có tài khoản?{' '}
        <Link
          href="/register"
          style={{ color: 'var(--brand-500)', fontWeight: 600, textDecoration: 'none' }}
        >
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
}
