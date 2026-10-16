'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function LessonError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
      <ErrorState
        title="Không thể tải bài học"
        description="Đã xảy ra lỗi trong quá trình tải nội dung bài học. Vui lòng kiểm tra lại đường truyền và thử lại."
        onRetry={reset}
      />
    </div>
  );
}
