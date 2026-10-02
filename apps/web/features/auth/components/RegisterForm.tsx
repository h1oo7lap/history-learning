'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, History, Check } from 'lucide-react';
import { RegisterSchema } from '@history-learning/shared';
import type { RegisterDto } from '@history-learning/shared';
import { useRegister } from '../hooks';
import { AuthHeroContent } from './LoginForm';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Ít nhất 8 ký tự', ok: password.length >= 8 },
    { label: 'Có ít nhất 1 chữ cái', ok: /[a-zA-Z]/.test(password) },
    { label: 'Có ít nhất 1 chữ số', ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['var(--error)', 'var(--warning)', 'var(--success)'];
  const color = password ? colors[score - 1] ?? colors[0] : 'var(--border)';

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < score ? color : 'var(--border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem',
            color: c.ok ? 'var(--success)' : 'var(--muted)' }}>
            <Check size={12} strokeWidth={3} style={{ opacity: c.ok ? 1 : 0.3 }} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
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

  const onSubmit = (data: RegisterDto) => {
    register_mutation.mutate(data);
  };

  return (
    <div className="auth-layout">
      {/* Hero */}
      <div className="auth-hero">
        <AuthHeroContent />
      </div>

      {/* Form */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.375rem', color: 'var(--foreground)' }}>
              Tạo tài khoản mới
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
              Tham gia cùng hàng nghìn học sinh đang học lịch sử mỗi ngày
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Full name */}
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

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="label" htmlFor="register-password">Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input${errors.password ? ' error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ paddingRight: '2.75rem' }}
                  {...register('password', {
                    onChange: (e) => setWatchedPassword(e.target.value),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                    display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password.message}</p>}
              {(watchedPassword || password) && (
                <PasswordStrength password={watchedPassword || password} />
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={register_mutation.isPending}
              style={{ marginTop: '0.5rem' }}
            >
              {register_mutation.isPending ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang tạo tài khoản...</>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          {/* Terms */}
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <Link href="/terms" style={{ color: 'var(--brand-500)', textDecoration: 'none' }}>Điều khoản sử dụng</Link>
            {' '}và{' '}
            <Link href="/privacy" style={{ color: 'var(--brand-500)', textDecoration: 'none' }}>Chính sách bảo mật</Link>
          </p>

          {/* Footer */}
          <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Đã có tài khoản?{' '}
            <Link href="/login" style={{ color: 'var(--brand-500)', fontWeight: 600, textDecoration: 'none' }}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
