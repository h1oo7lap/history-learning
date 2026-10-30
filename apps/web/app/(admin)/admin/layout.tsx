'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMe } from '@/features/auth/hooks';
import { Loader2, ShieldX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const ADMIN_LINKS = [
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/topics', label: 'Chủ đề' },
  { href: '/admin/periods', label: 'Giai đoạn' },
  { href: '/admin/characters', label: 'Nhân vật' },
  { href: '/admin/events', label: 'Sự kiện' },
  { href: '/admin/lessons', label: 'Bài học' },
  { href: '/admin/quizzes', label: 'Quiz' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.replace('/login');
    }
  }, [isLoading, isError, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-paper text-ink">
        <div className="w-12 h-12 rounded-md bg-seal text-paper flex items-center justify-center shadow-card">
          <Loader2 size={24} className="animate-spin" aria-hidden="true" />
        </div>
        <span className="text-sm font-sans text-muted">Đang xác thực quyền quản trị...</span>
      </div>
    );
  }

  if (!user) return null;

  // Forbidden for non-admin
  if (user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8 bg-paper text-ink">
        <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center">
          <ShieldX size={32} aria-hidden="true" />
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-ink">
          Không có quyền truy cập
        </h1>
        <p className="text-sm text-muted max-w-md leading-relaxed">
          Bạn không có quyền truy cập vào trang quản trị. Khu vực này chỉ dành riêng cho quản trị viên.
        </p>
        <Button asChild variant="primary" size="md">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper text-ink font-sans">
      {/* Admin sidebar */}
      <aside className="w-60 shrink-0 bg-card border-r border-line py-6 sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 pb-5 border-b border-line mb-3">
          <Link href="/admin" className="block text-ink hover:text-seal transition-colors">
            <span className="font-serif font-bold text-lg tracking-tight block">
              Quản trị hệ thống
            </span>
            <span className="text-xs text-muted">History Learning CMS</span>
          </Link>
        </div>

        <nav aria-label="Menu quản trị" className="space-y-0.5 px-3">
          {ADMIN_LINKS.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center h-10 px-3 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-paper text-seal font-semibold border-l-2 border-seal shadow-card'
                    : 'text-ink-soft hover:bg-paper hover:text-ink font-medium'
                )}
              >
                {label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-line/60">
            <Link
              href="/"
              className="flex items-center h-10 px-3 rounded-md text-sm text-muted hover:text-ink hover:bg-paper transition-colors"
            >
              ← Về trang học sinh
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 overflow-x-auto bg-paper">
        {children}
      </main>
    </div>
  );
}
