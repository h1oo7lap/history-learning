'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-paper text-ink">
        <div className="w-12 h-12 rounded-md bg-seal text-paper flex items-center justify-center shadow-card">
          <Loader2 size={24} className="animate-spin" aria-hidden="true" />
        </div>
        <span className="text-sm font-sans text-muted">Đang tải thông tin tài khoản...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

