import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LeaderboardPageClient } from '@/features/leaderboard/components/LeaderboardPageClient';

export const metadata: Metadata = {
  title: 'Bảng xếp hạng',
  description: 'Bảng vàng vinh danh học sinh có điểm kinh nghiệm (EXP) cao nhất theo từng khối lớp.',
};

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted">
          <Loader2 size={24} className="animate-spin text-seal" aria-hidden="true" />
          <span className="text-sm font-sans">Đang tải bảng xếp hạng...</span>
        </div>
      }
    >
      <LeaderboardPageClient />
    </Suspense>
  );
}

