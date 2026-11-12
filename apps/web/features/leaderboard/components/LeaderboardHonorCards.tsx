'use client';

import React from 'react';
import { Crown, Medal, Award, Sparkles } from 'lucide-react';
import type { LeaderboardEntryDto } from '@history-learning/shared';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

interface LeaderboardHonorCardsProps {
  top3: LeaderboardEntryDto[];
}

export function LeaderboardHonorCards({ top3 }: LeaderboardHonorCardsProps) {
  if (top3.length === 0) return null;

  const first = top3[0]!;
  const second = top3.length > 1 ? top3[1]! : null;
  const third = top3.length > 2 ? top3[2]! : null;

  // Trường hợp 1: Chỉ có 1 học sinh (Quán Quân) -> Căn chính giữa khung hình
  if (!second && !third) {
    const initials = first.fullName
      .trim()
      .split(' ')
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    return (
      <div className="p-4 sm:p-6 bg-paper/60 border-b border-line flex justify-center">
        <div
          className={cn(
            'rounded-lg border p-3 sm:p-4 flex flex-col items-center text-center bg-card shadow-sm transition-all w-48 sm:w-56',
            'border-amber-400 bg-gradient-to-b from-amber-500/10 via-card to-card ring-1 ring-amber-400/50',
            first.isCurrentUser && 'ring-2 ring-seal'
          )}
        >
          {/* Huy hiệu Quán Quân */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-paper shadow-xs whitespace-nowrap">
              <Crown size={13} className="shrink-0" aria-hidden="true" />
              <span>Quán Quân</span>
            </span>
          </div>

          {/* Khung ảnh thẻ */}
          <div className="relative my-1">
            <div className="rounded-md overflow-hidden border-2 border-amber-400 ring-2 ring-amber-400/20 bg-paper shadow-inner flex items-center justify-center w-20 h-26 sm:w-24 sm:h-30">
              {first.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={first.avatar}
                  alt={first.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-paper flex flex-col items-center justify-center text-ink-soft">
                  <span className="text-xl sm:text-2xl font-bold font-serif">{initials}</span>
                </div>
              )}
            </div>

            {first.isCurrentUser && (
              <Badge
                variant="success"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] h-4 px-1.5 font-bold shadow-xs"
              >
                Bạn
              </Badge>
            )}
          </div>

          {/* Tên học sinh & Cấp độ */}
          <div className="mt-2 space-y-0.5 w-full">
            <div className="font-serif font-bold text-ink text-sm sm:text-base truncate px-1">
              {first.fullName}
            </div>
            <div className="text-xs text-muted truncate">
              Cấp {first.level.displayOrder}: {first.level.name}
            </div>
          </div>

          {/* Điểm EXP */}
          <div className="mt-2 pt-2 border-t border-line/60 w-full flex items-center justify-center gap-1 text-bronze-ink font-bold text-xs sm:text-sm">
            <Sparkles size={12} className="shrink-0 text-bronze-ink" aria-hidden="true" />
            <span>{formatNumber(first.totalExp)} EXP</span>
          </div>
        </div>
      </div>
    );
  }

  // Trường hợp 2: Có từ 2 học sinh trở lên
  // Cố định vị trí 3 cột: Nhì bên trái (col 1), Quán Quân ở giữa (col 2), Ba bên phải (col 3)
  const cards = [
    { entry: second, rank: 2, label: 'Hạng Nhì', colClass: 'col-start-1' },
    { entry: first, rank: 1, label: 'Quán Quân', colClass: 'col-start-2' },
    third ? { entry: third, rank: 3, label: 'Hạng Ba', colClass: 'col-start-3' } : null,
  ].filter(Boolean) as Array<{
    entry: LeaderboardEntryDto;
    rank: number;
    label: string;
    colClass: string;
  }>;

  return (
    <div className="p-3 sm:p-6 bg-paper/60 border-b border-line">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-xl mx-auto">
        {cards.map(({ entry, rank, label, colClass }) => {
          const isFirst = rank === 1;
          const isSecond = rank === 2;

          const initials = entry.fullName
            .trim()
            .split(' ')
            .slice(-2)
            .map((w) => w[0])
            .join('')
            .toUpperCase();

          return (
            <div
              key={entry.userId}
              className={cn(
                'rounded-lg border p-2 sm:p-4 flex flex-col items-center text-center bg-card shadow-sm transition-all relative',
                colClass,
                isFirst
                  ? 'border-amber-400 bg-gradient-to-b from-amber-500/10 via-card to-card sm:-translate-y-2 ring-1 ring-amber-400/50 z-10'
                  : isSecond
                    ? 'border-slate-300 bg-gradient-to-b from-slate-400/10 to-card'
                    : 'border-bronze/50 bg-gradient-to-b from-bronze/10 to-card',
                entry.isCurrentUser && 'ring-2 ring-seal'
              )}
            >
              {/* Huy hiệu thứ hạng */}
              <div className="mb-1.5 sm:mb-2">
                {isFirst ? (
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500 text-paper shadow-xs whitespace-nowrap">
                    <Crown size={12} className="shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </span>
                ) : isSecond ? (
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-400 text-paper shadow-xs whitespace-nowrap">
                    <Medal size={11} className="shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-bronze text-paper shadow-xs whitespace-nowrap">
                    <Award size={11} className="shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </span>
                )}
              </div>

              {/* Khung ảnh thẻ (Portrait Photo Frame) */}
              <div className="relative my-0.5 sm:my-1">
                <div
                  className={cn(
                    'rounded-md overflow-hidden border-2 bg-paper shadow-inner flex items-center justify-center',
                    isFirst
                      ? 'w-16 h-22 sm:w-22 sm:h-28 border-amber-400 ring-2 ring-amber-400/20'
                      : 'w-14 h-19 sm:w-20 sm:h-26 border-line'
                  )}
                >
                  {entry.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.avatar}
                      alt={entry.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-paper flex flex-col items-center justify-center text-ink-soft">
                      <span className="text-base sm:text-2xl font-bold font-serif">{initials}</span>
                    </div>
                  )}
                </div>

                {entry.isCurrentUser && (
                  <Badge
                    variant="success"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] h-3.5 sm:h-4 px-1 sm:px-1.5 font-bold shadow-xs"
                  >
                    Bạn
                  </Badge>
                )}
              </div>

              {/* Tên học sinh & Cấp độ */}
              <div className="mt-1.5 sm:mt-2 space-y-0.5 w-full">
                <div className="font-serif font-bold text-ink text-xs sm:text-base truncate px-0.5">
                  {entry.fullName}
                </div>
                <div className="text-[10px] sm:text-xs text-muted truncate">
                  Cấp {entry.level.displayOrder}: {entry.level.name}
                </div>
              </div>

              {/* Điểm EXP */}
              <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-line/60 w-full flex items-center justify-center gap-1 text-bronze-ink font-bold text-[11px] sm:text-sm">
                <Sparkles size={11} className="shrink-0 text-bronze-ink" aria-hidden="true" />
                <span>{formatNumber(entry.totalExp)} EXP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
