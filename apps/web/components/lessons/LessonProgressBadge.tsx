'use client';

import React from 'react';
import { ProgressStatus } from '@history-learning/shared';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { useMyProgress } from '@/features/progress/hooks';
import { formatProgressStatus } from '@/lib/format';

export interface LessonProgressBadgeProps {
  lessonId: string;
  className?: string;
}

const statusBadgeVariant: Record<string, BadgeVariant> = {
  [ProgressStatus.IN_PROGRESS]: 'warning',
  [ProgressStatus.COMPLETED]: 'success',
};

export function LessonProgressBadge({ lessonId, className }: LessonProgressBadgeProps) {
  const { data: progressList } = useMyProgress();

  const progress = progressList?.find((p) => p.lessonId === lessonId);

  if (!progress) return null;

  if (
    progress.status !== ProgressStatus.IN_PROGRESS &&
    progress.status !== ProgressStatus.COMPLETED
  ) {
    return null;
  }

  const variant = statusBadgeVariant[progress.status] ?? 'default';
  const label = formatProgressStatus(progress.status);

  if (!label) return null;

  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
}
