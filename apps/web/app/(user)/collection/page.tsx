import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CollectionPageClient } from '@/features/collection/components/CollectionPageClient';

export const metadata: Metadata = {
  title: 'Bộ sưu tập',
  description: 'Kho tàng các tư liệu nhân vật và sự kiện lịch sử bạn đã mở khóa qua các bài học.',
};

export default function CollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted">
          <Loader2 size={24} className="animate-spin text-seal" aria-hidden="true" />
          <span className="text-sm font-sans">Đang tải bộ sưu tập...</span>
        </div>
      }
    >
      <CollectionPageClient />
    </Suspense>
  );
}

