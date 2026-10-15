import Link from 'next/link';
import { History } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-paper border-t border-line mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-line/60">
          {/* Brand info */}
          <div className="space-y-1.5 max-w-md">
            <Link
              href="/"
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
              className="text-ink-soft hover:text-seal transition-colors font-medium"
            >
              Trang chủ
            </Link>
            <Link
              href="/lessons"
              className="text-ink-soft hover:text-seal transition-colors font-medium"
            >
              Danh sách bài học
            </Link>
            <Link
              href="/login"
              className="text-ink-soft hover:text-seal transition-colors font-medium"
            >
              Tài khoản
            </Link>
          </nav>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <p>© {new Date().getFullYear()} Học Lịch Sử. Bản quyền tư liệu thuộc về các tác giả và nguồn lưu trữ lịch sử.</p>
          <p className="text-muted/80">Hệ thiết kế phong cách Sách sử Việt Nam</p>
        </div>
      </div>
    </footer>
  );
}
