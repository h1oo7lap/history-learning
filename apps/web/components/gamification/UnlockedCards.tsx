'use client';

import React from 'react';
import { Users, Bookmark, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import type { UnlockedCardItemDto } from '@history-learning/shared';

export interface UnlockedCardsProps {
  characters?: UnlockedCardItemDto[];
  events?: UnlockedCardItemDto[];
  className?: string;
}

export function UnlockedCards({
  characters,
  events,
  className,
}: UnlockedCardsProps) {
  const hasCharacters = Boolean(characters && characters.length > 0);
  const hasEvents = Boolean(events && events.length > 0);

  if (!hasCharacters && !hasEvents) {
    return null;
  }

  return (
    <div className={cn('space-y-3 pt-2 border-t border-line/60', className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-seal uppercase tracking-wider">
        <Sparkles size={14} className="text-seal shrink-0" aria-hidden="true" />
        <span>Khám phá lịch sử mới mở khóa</span>
      </div>

      {hasCharacters && characters && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted flex items-center gap-1">
            <Users size={13} className="text-muted" aria-hidden="true" />
            <span>Thẻ nhân vật lịch sử:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {characters.map((char) => (
              <div
                key={char.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-sm border border-line bg-paper text-ink transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-seal/10 text-seal flex items-center justify-center text-xs shrink-0 font-serif font-bold">
                    {char.name.charAt(0)}
                  </span>
                  <span className="font-serif text-sm font-medium text-ink truncate" title={char.name}>
                    {char.name}
                  </span>
                </div>
                <Badge variant="warning" className="text-[11px] h-5 px-1.5 shrink-0">
                  Mới
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasEvents && events && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted flex items-center gap-1">
            <Bookmark size={13} className="text-muted" aria-hidden="true" />
            <span>Thẻ sự kiện lịch sử:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-sm border border-line bg-paper text-ink transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-bronze/10 text-bronze-ink flex items-center justify-center text-xs shrink-0 font-serif font-bold">
                    ★
                  </span>
                  <span className="font-serif text-sm font-medium text-ink truncate" title={evt.name}>
                    {evt.name}
                  </span>
                </div>
                <Badge variant="warning" className="text-[11px] h-5 px-1.5 shrink-0">
                  Mới
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

