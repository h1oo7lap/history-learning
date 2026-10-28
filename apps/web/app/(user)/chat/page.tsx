import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChatPageClient } from './ChatPageClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hỏi đáp Lịch sử | Học Lịch Sử',
  description: 'Trợ lý học tập AI giải đáp thắc mắc và cung cấp tư liệu lịch sử Việt Nam đáng tin cậy.',
};

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted">
          <Loader2 size={24} className="animate-spin text-seal" aria-hidden="true" />
          <span className="text-sm font-sans">Đang tải khung hỏi đáp...</span>
        </div>
      }
    >
      <ChatPageClient />
    </Suspense>
  );
}
