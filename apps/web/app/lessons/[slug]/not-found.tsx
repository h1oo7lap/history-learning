import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LessonNotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
      <div className="border border-line rounded-md bg-card p-8 sm:p-12 shadow-card space-y-6">
        <div className="w-16 h-16 rounded-full bg-paper border border-line flex items-center justify-center mx-auto text-muted">
          <BookOpen size={32} className="text-seal" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
            Bài học không tồn tại
          </h1>
          <p className="text-muted text-sm sm:text-base max-w-md mx-auto">
            Bài học bạn đang tìm kiếm không tồn tại, đã bị lưu trữ hoặc đường dẫn bài viết không chính xác.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/lessons"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-md inline-block"
          >
            <Button variant="primary" size="md">
              Quay lại danh sách bài học
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
