'use client';

import React, { useEffect, useRef } from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import { ProgressStatus } from '@history-learning/shared';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useIsAuthenticated } from '@/features/auth/hooks';
import {
  useMyProgress,
  useStartLesson,
  useCompleteLesson,
} from '@/features/progress/hooks';

export interface LessonProgressControlProps {
  lessonId: string;
  className?: string;
}

export function LessonProgressControl({ lessonId, className }: LessonProgressControlProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useIsAuthenticated();
  const { data: progressList, isLoading: isProgressLoading } = useMyProgress();
  const { mutate: startLesson } = useStartLesson();
  const { mutate: completeLesson, isPending: isCompleting } = useCompleteLesson();

  const startedLessonIdRef = useRef<string | null>(null);

  // Gọi start một lần khi mở bài nếu người dùng đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && startedLessonIdRef.current !== lessonId) {
      startedLessonIdRef.current = lessonId;
      startLesson(lessonId);
    }
  }, [isAuthenticated, lessonId, startLesson]);

  // Khách chưa đăng nhập: không render gì
  if (isAuthLoading || !isAuthenticated) {
    return null;
  }

  // Trạng thái đang tải tiến độ người dùng
  if (isProgressLoading) {
    return <Skeleton className="h-11 w-44 rounded-md" />;
  }

  const currentProgress = progressList?.find((p) => p.lessonId === lessonId);
  const isCompleted = currentProgress?.status === ProgressStatus.COMPLETED;

  // Khi đã hoàn thành: hiện "Đã học xong", vô hiệu hóa để không bấm lại
  if (isCompleted) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="md"
        disabled
        className="border-success/40 bg-success/10 text-success cursor-default"
      >
        <Check size={16} aria-hidden="true" />
        <span>Đã học xong</span>
      </Button>
    );
  }

  // Chưa hoàn thành: hiện nút "Đánh dấu đã học xong"
  return (
    <Button
      type="button"
      variant="primary"
      size="md"
      loading={isCompleting}
      onClick={() => completeLesson(lessonId)}
      className={className}
    >
      <CheckCircle2 size={16} aria-hidden="true" />
      <span>Đánh dấu đã học xong</span>
    </Button>
  );
}
