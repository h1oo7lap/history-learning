'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useMe } from '@/features/auth/hooks';
import { authApi } from '@/features/auth/api';
import { Loader2 } from 'lucide-react';

/**
 * Auth gate: redirects to /login if not authenticated.
 * Used by the (user) layout to protect all user routes.
 *
 * When useMe() returns an error (e.g. stale/invalid JWT cookie from a previous
 * session), we call POST /auth/logout first to clear the httpOnly cookie before
 * redirecting to /login. Without this step the middleware still sees the cookie
 * and bounces the user back to /dashboard, creating an infinite redirect loop.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();
  const clearingRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (isError) {
      // JWT is invalid/expired — clear the cookie via logout endpoint so
      // middleware won't bounce us back to /dashboard.
      if (clearingRef.current) return;
      clearingRef.current = true;
      authApi.logout().catch(() => {
        // ignore — cookie may already be gone or server unreachable
      }).finally(() => {
        router.replace('/login');
      });
      return;
    }

    if (!user) {
      router.replace('/login');
    }
  }, [isLoading, isError, user, router]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', flexDirection: 'column', gap: '1rem',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader2 size={26} color="white" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <span style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>Đang tải...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
