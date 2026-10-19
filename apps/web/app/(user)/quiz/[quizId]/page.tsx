'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuizzes, useStartQuiz } from '@/features/quizzes/hooks';
import type { StartQuizResponseDto } from '@/features/quizzes/api';
import { QuizIntro } from '@/features/quizzes/components/QuizIntro';
import { QuizTaking } from '@/features/quizzes/components/QuizTaking';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ApiClientError } from '@/lib/api-client';

export default function StudentQuizRunnerPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();

  // Dữ liệu intro lấy từ cache useQuizzes (Adjustment 5)
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuizzes();
  const quiz = quizzes?.find((q) => q.id === quizId);

  const startQuizMutation = useStartQuiz();
  const [activeAttemptData, setActiveAttemptData] = useState<StartQuizResponseDto | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Bấm bắt đầu làm bài mới gọi startQuiz (Adjustment 5)
  const handleStart = async () => {
    setErrorCode(null);

    startQuizMutation.mutate(quizId, {
      onSuccess: (data) => {
        setActiveAttemptData(data);
      },
      onError: (err: unknown) => {
        if (err instanceof ApiClientError) {
          setErrorCode(err.errorCode);
          if (err.errorCode === 'LESSON_NOT_COMPLETED') {
            toast.error('Bạn cần hoàn thành bài học trước khi làm quiz!');
          } else if (err.errorCode === 'QUIZ_NOT_PUBLISHED') {
            toast.error('Quiz này hiện chưa được xuất bản hoặc không khả dụng.');
          } else {
            toast.error(err.message || 'Không thể bắt đầu làm bài.');
          }
        } else {
          toast.error('Đã xảy ra lỗi khi bắt đầu bài làm.');
        }
      },
    });
  };

  // Trạng thái 1: Đang tải thông tin quiz từ danh sách
  if (isQuizzesLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="border-line">
          <CardHeader className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
            </div>
            <Skeleton className="h-12 w-full rounded-md mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trạng thái 2: Không tìm thấy quiz trong danh sách khả dụng
  if (!quiz && !isQuizzesLoading) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <ErrorState
          title="Không tìm thấy bài quiz"
          description="Bài quiz này không tồn tại, chưa xuất bản hoặc không thuộc khối lớp của bạn."
          retryHref="/quiz"
          retryLabel="Về danh sách bài quiz"
        />
      </div>
    );
  }

  // Trạng thái 3: Đã bắt đầu -> hiển thị màn làm bài
  if (activeAttemptData) {
    return (
      <QuizTaking
        quizId={quizId}
        attemptData={activeAttemptData}
        onSubmitted={(attemptId) => router.push(`/quiz/attempts/${attemptId}`)}
        onExpired={() => router.push('/quiz')}
      />
    );
  }

  // Trạng thái 4: Màn hình giới thiệu thể lệ bài quiz
  return (
    <QuizIntro
      quiz={quiz!}
      onStart={handleStart}
      isStarting={startQuizMutation.isPending}
      errorCode={errorCode}
    />
  );
}
