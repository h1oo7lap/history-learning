'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { RegisterSchema } from '@history-learning/shared';
import type { RegisterDto } from '@history-learning/shared';
import { Button } from '@/components/ui/Button';
import { useRegister } from '../hooks';
import { AuthShell } from './AuthShell';
import { PasswordField } from './PasswordField';

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Ít nhất 8 ký tự', ok: password.length >= 8 },
    { label: 'Có ít nhất 1 chữ cái', ok: /[a-zA-Z]/.test(password) },
    { label: 'Có ít nhất 1 chữ số', ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['var(--error)', 'var(--warning)', 'var(--success)'];
  const color = password ? colors[score - 1] ?? colors[0] : 'var(--border)';

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < score ? color : 'var(--border)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {checks.map((c) => (
          <div
            key={c.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8rem',
              color: c.ok ? 'var(--success)' : 'var(--muted)',
            }}
          >
            <Check size={12} strokeWidth={3} style={{ opacity: c.ok ? 1 : 0.3 }} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RegisterForm() {
  const [watchedPassword, setWatchedPassword] = useState('');
  const register_mutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterDto>({
    resolver: zodResolver(RegisterSchema),
  });

  const password = watch('password', '');
  const onSubmit = (data: RegisterDto) => register_mutation.mutate(data);

  return (
    <AuthShell
      title="Tạo tài khoản mới"
      description="Tham gia cùng hàng nghìn học sinh đang học lịch sử mỗi ngày"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
      >
        <div>
          <label className="label" htmlFor="register-fullname">Họ và tên</label>
          <input
            id="register-fullname"
            type="text"
            className={`input${errors.fullName ? ' error' : ''}`}
            placeholder="Nguyễn Văn An"
            autoComplete="name"
            {...register('fullName')}
          />
          {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            className={`input${errors.email ? ' error' : ''}`}
            placeholder="email@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>

        <PasswordField
          id="register-password"
          label="Mật khẩu"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            onChange: (e) => setWatchedPassword(e.target.value),
          })}
        >
          {(watchedPassword || password) ? (
            <PasswordStrength password={watchedPassword || password} />
          ) : null}
        </PasswordField>

        <Button
          id="register-submit-btn"
          type="submit"
          size="lg"
          loading={register_mutation.isPending}
          className="w-full mt-2"
        >
          {register_mutation.isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </Button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.6 }}>
        Bằng cách đăng ký, bạn đồng ý với{' '}
        <Link href="/terms" style={{ color: 'var(--brand-500)', textDecoration: 'none' }}>
          Điều khoản sử dụng
        </Link>{' '}
        và{' '}
        <Link href="/privacy" style={{ color: 'var(--brand-500)', textDecoration: 'none' }}>
          Chính sách bảo mật
        </Link>
      </p>

      <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
        Đã có tài khoản?{' '}
        <Link href="/login" style={{ color: 'var(--brand-500)', fontWeight: 600, textDecoration: 'none' }}>
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
