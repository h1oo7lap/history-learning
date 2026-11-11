'use client';

import React, { useState } from 'react';
import { Sparkles, Calendar, MapPin, Scroll } from 'lucide-react';
import type { UserCollectionEventDto } from '@history-learning/shared';
import { Badge } from '@/components/ui/Badge';
import { formatDate, optimizeCloudinaryUrl } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface EventCardProps {
  event: UserCollectionEventDto;
  onSelect?: (event: UserCollectionEventDto) => void;
  className?: string;
}

export function formatEventDateRange(
  startDate?: string | Date | null,
  endDate?: string | Date | null
): string | null {
  if (!startDate && !endDate) return null;

  if (startDate && endDate) {
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);
    if (startStr === endStr) return startStr;
    return `${startStr} – ${endStr}`;
  }

  if (startDate) {
    return formatDate(startDate);
  }

  if (endDate) {
    return `Đến ${formatDate(endDate)}`;
  }

  return null;
}

export function EventCard({
  event,
  onSelect,
  className,
}: EventCardProps) {
  const [imageError, setImageError] = useState(false);
  const dateRange = formatEventDateRange(event.startDate, event.endDate);
  const imageUrl = event.image ? optimizeCloudinaryUrl(event.image, 240) : null;
  const showFallback = !imageUrl || imageError;

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelect?.(event)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(event);
        }
      }}
      aria-label={`Xem tư liệu sự kiện ${event.name}`}
      className={cn(
        'group text-left flex flex-col justify-between rounded-md border border-line bg-card p-4 sm:p-5 transition-all duration-200',
        'hover:border-bronze hover:shadow-card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal',
        className
      )}
    >
      <div className="space-y-3">
        {/* Header với biểu trưng sự kiện và tên */}
        <div className="flex items-start gap-3.5">
          {/* Ảnh sự kiện hoặc emblem container */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-md border border-line bg-paper overflow-hidden relative flex items-center justify-center select-none shadow-sm">
            {imageUrl && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={event.name}
                loading="lazy"
                decoding="async"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : null}

            {showFallback && (
              <div
                data-testid="event-fallback"
                className="flex flex-col items-center justify-center w-full h-full bg-bronze/10 text-bronze-ink group-hover:bg-bronze/20 transition-colors"
                aria-hidden="true"
              >
                <Scroll size={26} className="text-bronze-ink shrink-0" />
              </div>
            )}
          </div>

          {/* Tên sự kiện, thời gian và địa điểm */}
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base sm:text-lg font-bold text-ink leading-snug group-hover:text-seal transition-colors line-clamp-2">
              {event.name}
            </h3>

            {dateRange && (
              <div className="flex items-center gap-1.5 text-xs text-muted font-sans font-medium mt-1 truncate">
                <Calendar size={12} className="shrink-0 text-muted/70" aria-hidden="true" />
                <span className="truncate">{dateRange}</span>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted font-sans font-medium mt-0.5 truncate">
                <MapPin size={12} className="shrink-0 text-muted/70" aria-hidden="true" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mô tả sự kiện */}
        {event.description ? (
          <p className="font-serif text-[13px] sm:text-sm text-ink-soft leading-relaxed line-clamp-3">
            {event.description}
          </p>
        ) : (
          <p className="text-xs text-muted italic font-serif">
            Chưa có tóm tắt chi tiết cho sự kiện này.
          </p>
        )}
      </div>

      {/* Footer: Trạng thái đã mở khóa + Ngày mở khóa */}
      <div className="pt-3 mt-4 border-t border-line/60 flex items-center justify-between text-xs font-sans gap-2">
        <Badge
          variant="warning"
          className="inline-flex items-center gap-1 text-[11px] font-medium py-0.5 px-2 bg-bronze/10 text-bronze-ink border-bronze/30"
        >
          <Sparkles size={11} className="text-bronze-ink shrink-0" aria-hidden="true" />
          <span>Đã mở khóa</span>
        </Badge>

        <span className="text-muted text-[11px] truncate">
          {formatDate(event.unlockedAt)}
        </span>
      </div>
    </article>
  );
}
