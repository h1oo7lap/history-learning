'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ForgotPasswordSchema } from '@history-learning/shared';
import type { ForgotPasswordDto } from '@history-learning/shared';
import { Button } from '@/components/ui/Button';
import { useForgotPassword } from '@/features/auth/hooks';
import { AuthShell } from './AuthShell';

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordDto>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  return (
    <AuthShell
      title="Quên mật khẩu?"
      description="Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu"
    >
      {forgotPassword.isSuccess ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 12,
              background: 'rgb(16 185 129 / 0.08)',
              border: '1.5px solid rgb(16 185 129 / 0.25)',
              textAlign: 'center',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: '1.0625rem',
                marginBottom: '0.5rem',
                color: 'var(--success)',
              }}
            >
              ✉️ Email đã được gửi!
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút.
              Vui lòng kiểm tra hộp thư đến và mục thư rác (Spam).
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => forgotPassword.reset()}
          >
            Gửi lại yêu cầu khác
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit((d) => forgotPassword.mutate(d.email))}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
        >
          <div>
            <label className="label" htmlFor="forgot-email">
              Email
            </label>
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

          <Button
            id="forgot-submit-btn"
            type="submit"
            size="lg"
            loading={forgotPassword.isPending}
            className="w-full mt-2"
          >
            {forgotPassword.isPending ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
          </Button>
        </form>
      )}

      {/* Footer */}
      <p
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--muted)',
        }}
      >
        <Link
          href="/login"
          style={{
            color: 'var(--brand-500)',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
