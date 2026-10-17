'use client';

import type { CSSProperties, ReactNode } from 'react';
import { History } from 'lucide-react';
import { AuthHeroContent } from './AuthHero';

export interface AuthShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  cardStyle?: CSSProperties;
}

export function AuthLogo({ center = false }: { center?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${center ? 'justify-center mb-8' : 'mb-6'}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: center ? 'center' : undefined,
        gap: '0.625rem',
        marginBottom: center ? '2rem' : '1.5rem',
      }}
    >
      <div
        className="w-10 h-10 rounded-lg bg-seal text-paper flex items-center justify-center shadow-card"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: 'var(--color-seal, #9B2C2C)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-paper, #FAF6EE)',
        }}
      >
        <History size={22} color="currentColor" />
      </div>
      <span
        className="font-serif font-bold text-lg text-ink"
        style={{
          fontFamily: 'var(--font-serif), Georgia, serif',
          fontWeight: 700,
          fontSize: '1.125rem',
          color: 'var(--color-ink, #1F1B16)',
        }}
      >
        Học Lịch Sử
      </span>
    </div>
  );
}

export function AuthShell({ children, title, description, cardStyle }: AuthShellProps) {
  return (
    <div className="auth-layout">
      {/* Hero panel */}
      <div className="auth-hero">
        <AuthHeroContent />
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card" style={cardStyle}>
          {title ? (
            <div style={{ marginBottom: '2rem' }}>
              <AuthLogo />
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  marginBottom: '0.375rem',
                  color: 'var(--foreground)',
                }}
              >
                {title}
              </h1>
              {description ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
