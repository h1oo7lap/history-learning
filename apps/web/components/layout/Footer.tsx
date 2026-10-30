'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Footer() {
  const pathname = usePathname();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-paper border-t border-line mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-line/60">
          {/* Brand info */}
          <div className="space-y-1.5 max-w-md">
            <Link
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="inline-flex items-center gap-2 text-ink hover:text-seal transition-colors font-serif font-bold text-base"
            >
              <div className="w-6 h-6 rounded bg-seal text-paper flex items-center justify-center">
                <History size={14} aria-hidden="true" />
              </div>
              <span>Học Lịch Sử</span>
            </Link>
            <p className="text-sm text-muted leading-relaxed">
              Nền tảng học và ôn tập lịch sử Việt Nam dành cho học sinh từ lớp 4 đến lớp 12.
            </p>
          </div>

          {/* Quick links to real pages */}
          <nav aria-label="Liên kết chân trang" className="flex flex-wrap items-center gap-6 text-sm">
            <Link
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className={cn(
                'transition-colors font-medium',
                pathname === '/' ? 'text-seal font-semibold' : 'text-ink-soft hover:text-seal'
              )}
            >
              Trang chủ
            </Link>
            <Link
              href="/lessons"
              onClick={(e) => handleLinkClick(e, '/lessons')}
              className={cn(
                'transition-colors font-medium',
                pathname === '/lessons' ? 'text-seal font-semibold' : 'text-ink-soft hover:text-seal'
              )}
            >
              Danh sách bài học
            </Link>
            <Link
              href="/quiz"
              onClick={(e) => handleLinkClick(e, '/quiz')}
              className={cn(
                'transition-colors font-medium',
                pathname === '/quiz' ? 'text-seal font-semibold' : 'text-ink-soft hover:text-seal'
              )}
            >
              Quiz
            </Link>
            <Link
              href="/profile"
              onClick={(e) => handleLinkClick(e, '/profile')}
              className={cn(
                'transition-colors font-medium',
                pathname === '/profile' ? 'text-seal font-semibold' : 'text-ink-soft hover:text-seal'
              )}
            >
              Tài khoản
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <p>© {new Date().getFullYear()} Học Lịch Sử. Bản quyền tư liệu thuộc về các tác giả và nguồn lưu trữ lịch sử.</p>
          <div className="flex items-center gap-4">
            <p className="text-muted/80">Hệ thiết kế phong cách Sách sử Việt Nam</p>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-ink-soft hover:text-seal transition-colors cursor-pointer font-medium"
              title="Cuộn lên đầu trang"
            >
              <span>Lên đầu trang</span>
              <ArrowUp size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
