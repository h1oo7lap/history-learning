'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, BookOpen, Loader2, GraduationCap, History } from 'lucide-react';
import { LoginSchema } from '@history-learning/shared';
import type { LoginDto } from '@history-learning/shared';
import { useLogin, authKeys } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="auth-layout">
      {/* Hero panel */}
      <div className="auth-hero">
        <AuthHeroContent />
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Logo */}
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
              Chào mừng trở lại
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
              Đăng nhập để tiếp tục hành trình khám phá lịch sử
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Email */}
            <div>
              <label className="label" htmlFor="login-email">Email</label>
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="label" htmlFor="login-password" style={{ margin: 0 }}>Mật khẩu</label>
                <Link href="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--brand-500)', textDecoration: 'none' }}>
                  Quên mật khẩu?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input${errors.password ? ' error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                  {...register('password')}
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
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={login.isPending}
              style={{ marginTop: '0.5rem' }}
            >
              {login.isPending ? (
                <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang đăng nhập...</>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Chưa có tài khoản?{' '}
            <Link href="/register" style={{ color: 'var(--brand-500)', fontWeight: 600, textDecoration: 'none' }}>
              Đăng ký ngay
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

// ─── Shared hero content ──────────────────────────────────────
export function AuthHeroContent() {
  return (
    <div style={{ position: 'relative', zIndex: 1, padding: '3rem', textAlign: 'center', maxWidth: 480 }}>
      {/* Stars */}
      <div className="auth-stars">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="auth-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--duration': `${2 + Math.random() * 4}s`,
              '--delay': `${Math.random() * 3}s`,
              '--max-opacity': `${0.3 + Math.random() * 0.7}`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          width: 96, height: 96, borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(90, 114, 247, 0.5), rgba(139, 92, 246, 0.4))',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 2rem',
          backdropFilter: 'blur(8px)',
        }}>
          <GraduationCap size={48} color="white" strokeWidth={1.5} />
        </div>

        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>
          Khám phá <br />
          <span style={{ background: 'linear-gradient(135deg, #7c9dff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lịch Sử Việt Nam
          </span>
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: '1.0625rem', marginBottom: '2.5rem' }}>
          Nền tảng học lịch sử tương tác dành cho học sinh từ lớp 4 đến lớp 12. 
          Học bài, làm quiz và thu thập thẻ nhân vật lịch sử.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', justifyContent: 'center' }}>
          {['📚 Bài học phong phú', '🧩 Quiz tương tác', '🃏 Thu thập thẻ', '🎯 Nhiệm vụ hàng ngày'].map(f => (
            <span key={f} style={{
              padding: '0.375rem 0.875rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 100,
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.875rem',
              backdropFilter: 'blur(4px)',
            }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
