'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useQuizzes } from '@/features/quizzes/hooks';
import { QuizCard } from '@/features/quizzes/components/QuizCard';
import { QuizCardSkeleton } from '@/features/quizzes/components/QuizCardSkeleton';

export default function StudentQuizzesPage() {
  const { data: quizzes, isLoading, isError, refetch } = useQuizzes();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10">
      <PageHeader
        title="Bộ câu hỏi lịch sử"
        description="Luyện tập và kiểm tra kiến thức các bài học đã hoàn thành."
        className="mb-8"
      />

      {/* Trạng thái 1: Đang tải dữ liệu */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <QuizCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Trạng thái 2: Lỗi tải dữ liệu */}
      {isError && !isLoading && (
        <ErrorState
          title="Không thể tải danh sách bài quiz"
          description="Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau ít phút."
          onRetry={() => refetch()}
        />
      )}

      {/* Trạng thái 3: Danh sách rỗng */}
      {!isLoading && !isError && quizzes?.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Chưa có bài quiz nào"
          description="Hiện tại chưa có bài quiz nào khả dụng cho khối lớp của bạn. Hãy hoàn thành thêm các bài học để mở khóa câu hỏi luyện tập!"
          action={{
            label: 'Khám phá bài học',
            href: '/lessons',
          }}
        />
      )}

      {/* Trạng thái 4: Hiển thị danh sách thẻ quiz */}
      {!isLoading && !isError && quizzes && quizzes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
