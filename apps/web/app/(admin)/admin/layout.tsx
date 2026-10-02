'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hooks';
import { Loader2, ShieldX } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.replace('/login');
    }
  }, [isLoading, isError, user, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-500)' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  // Forbidden for non-admin
  if (user.role !== 'ADMIN') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', gap: '1rem', textAlign: 'center', padding: '2rem',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgb(239 68 68 / 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldX size={36} color="var(--error)" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Không có quyền truy cập</h1>
        <p style={{ color: 'var(--muted)', maxWidth: 400 }}>
          Bạn không có quyền truy cập vào trang quản trị. Chỉ quản trị viên mới có thể vào đây.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Admin sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '1.5rem 0',
        position: 'sticky', top: 0, height: '100dvh',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--foreground)' }}>
              ⚙️ Quản trị
            </div>
          </Link>
        </div>
        {[
          { href: '/admin/users', label: '👥 Người dùng' },
          { href: '/admin/topics', label: '📂 Chủ đề' },
          { href: '/admin/periods', label: '🕰️ Giai đoạn' },
          { href: '/admin/characters', label: '🧑‍💼 Nhân vật' },
          { href: '/admin/events', label: '📅 Sự kiện' },
          { href: '/admin/lessons', label: '📖 Bài học' },
          { href: '/admin/quizzes', label: '🧩 Quiz' },
          { href: '/admin/missions', label: '🎯 Nhiệm vụ' },
          { href: '/admin/cards', label: '🃏 Thẻ lịch sử' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'block', padding: '0.625rem 1.25rem',
              fontSize: '0.9rem', color: 'var(--foreground)',
              textDecoration: 'none',
              transition: 'background 0.1s',
            }}
          >
            {label}
          </Link>
        ))}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
        {children}
      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
