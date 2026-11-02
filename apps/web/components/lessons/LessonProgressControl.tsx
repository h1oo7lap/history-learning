'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';
import { ProgressStatus, type LessonRewardResultDto } from '@history-learning/shared';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { RewardModal } from '@/components/gamification/RewardModal';
import { useIsAuthenticated } from '@/features/auth/hooks';
import {
  useMyProgress,
  useStartLesson,
  useCompleteLesson,
} from '@/features/progress/hooks';

export interface LessonProgressControlProps {
  lessonId: string;
  quiz?: {
    id: string;
    title?: string;
    status: string;
  } | null;
  nextLesson?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  className?: string;
}

export function LessonProgressControl({
  lessonId,
  quiz,
  nextLesson,
  className,
}: LessonProgressControlProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useIsAuthenticated();
  const { data: progressList, isLoading: isProgressLoading } = useMyProgress();
  const { mutate: startLesson } = useStartLesson();
  const { mutate: completeLesson, isPending: isCompleting } = useCompleteLesson();

  // Lưu reward nhận được từ response API completeLesson và điều khiển Modal
  const [reward, setReward] = useState<LessonRewardResultDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const isQuizPublished = quiz?.status === 'PUBLISHED';

  const handleComplete = () => {
    completeLesson(lessonId, {
      onSuccess: (data) => {
        if (data.reward) {
          const hasReward = Boolean(
            data.reward.expGained > 0 ||
              (data.reward.unlockedCharacters && data.reward.unlockedCharacters.length > 0) ||
              (data.reward.unlockedEvents && data.reward.unlockedEvents.length > 0)
          );
          if (hasReward) {
            setReward(data.reward);
            setIsModalOpen(true);
          }
        }
      },
    });
  };

  // Khi đã hoàn thành: hiện "Đã học xong", và hiển thị CTA "Làm bài kiểm tra ngay" nếu có quiz đã publish
  if (isCompleted) {
    return (
      <>
        {reward && (
          <RewardModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            reward={reward}
          />
        )}
        <div className="flex items-center gap-3 flex-wrap">
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
          {isQuizPublished && (
            <Button asChild variant="primary" size="md" className="gap-2">
              <Link href={`/quiz/${quiz.id}`}>
                <HelpCircle size={16} aria-hidden="true" />
                <span>Làm bài kiểm tra ngay</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Button>
          )}
          {nextLesson && (
            <Button
              asChild
              variant={isQuizPublished ? 'secondary' : 'primary'}
              size="md"
              className="gap-2"
              title={nextLesson.title}
            >
              <Link href={`/lessons/${nextLesson.slug}`}>
                <span>Bài tiếp theo</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </>
    );
  }

  // Chưa hoàn thành: hiện nút "Đánh dấu đã học xong"
  return (
    <Button
      type="button"
      variant="primary"
      size="md"
      loading={isCompleting}
      onClick={handleComplete}
      className={className}
    >
      <CheckCircle2 size={16} aria-hidden="true" />
      <span>Đánh dấu đã học xong</span>
    </Button>
  );
}
