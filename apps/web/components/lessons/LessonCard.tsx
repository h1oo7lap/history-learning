'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import type { PublicLessonSummary } from '@/features/lessons/api';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDifficulty, formatGrade, optimizeCloudinaryUrl } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface LessonCardProps {
  lesson: PublicLessonSummary;
  className?: string;
}

const difficultyBadgeVariant: Record<string, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

export function LessonCard({ lesson, className }: LessonCardProps) {
  const [imageError, setImageError] = useState(false);

  const gradeText = lesson.grades?.[0]?.grade ? formatGrade(lesson.grades[0].grade) : '';
  const periodText = lesson.periods?.[0]?.period?.name ?? '';
  const metaLine = [gradeText, periodText].filter(Boolean).join(' · ');

  const topics = lesson.topics?.map((t) => t.topic) ?? [];
  const displayTopics = topics.slice(0, 2);

  const badgeVariant = difficultyBadgeVariant[lesson.difficulty] ?? 'default';
  const difficultyLabel = formatDifficulty(lesson.difficulty);

  const thumbnailUrl = lesson.thumbnail ? optimizeCloudinaryUrl(lesson.thumbnail, 640) : null;

  return (
    <Link
      href={`/lessons/${lesson.slug}`}
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-md h-full"
    >
      <Card interactive className={cn('h-full flex flex-col overflow-hidden', className)}>
        {/* Khung ảnh tỷ lệ cố định 16:10 */}
        <div className="relative aspect-[16/10] w-full bg-paper overflow-hidden border-b border-line shrink-0">
          {/* Lớp nền giấy dự phòng với biểu tượng sách */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper text-muted/60 p-4 select-none">
            <BookOpen size={36} aria-hidden="true" />
            <span className="text-xs font-serif mt-1.5 text-muted">Học Lịch Sử</span>
          </div>

          {thumbnailUrl && !imageError && (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={lesson.title}
              ref={(node) => {
                if (node && node.complete && node.naturalWidth === 0) {
                  setImageError(true);
                }
              }}
              src={thumbnailUrl}
              onError={() => setImageError(true)}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>

        {/* Thân thẻ */}
        <div className="p-4 md:p-5 flex flex-col flex-1">
          {/* Lớp · Giai đoạn */}
          {metaLine && (
            <span className="text-xs font-medium text-muted mb-1.5 line-clamp-1">
              {metaLine}
            </span>
          )}

          {/* Tiêu đề tối đa 2 dòng */}
          <h2 className="font-serif text-base md:text-lg font-bold text-ink group-hover:text-seal transition-colors line-clamp-2 leading-snug mb-2">
            {lesson.title}
          </h2>

          {/* Tóm tắt tối đa 2 dòng */}
          {lesson.summary && (
            <p className="text-xs md:text-sm text-muted line-clamp-2 leading-relaxed mb-4 flex-1">
              {lesson.summary}
            </p>
          )}

          {/* Chủ đề/Tags (tối đa 2 nhãn) */}
          {displayTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {displayTopics.map((topic) => (
                <span
                  key={topic.id}
                  className="inline-block text-[11px] font-medium text-ink-soft bg-line/40 px-2 py-0.5 rounded-sm"
                >
                  {topic.name}
                </span>
              ))}
            </div>
          )}

          {/* Cuối thẻ: thời gian đọc + độ khó bằng chữ */}
          <div className="pt-3 border-t border-line/50 flex items-center justify-between text-xs text-muted mt-auto">
            <span className="inline-flex items-center gap-1 font-medium">
              <Clock size={13} aria-hidden="true" />
              <span>{lesson.estimatedTime} phút</span>
            </span>
            <Badge variant={badgeVariant} dot>
              {difficultyLabel}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function LessonCardSkeleton() {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4 md:p-5 flex flex-col flex-1 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="space-y-1 flex-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex gap-1.5 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="pt-3 border-t border-line/50 flex items-center justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-5 w-16 rounded-sm" />
        </div>
      </div>
    </Card>
  );
}
