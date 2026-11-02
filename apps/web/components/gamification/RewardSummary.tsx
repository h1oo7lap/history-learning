'use client';

import React from 'react';
import { Award, BookOpen, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { UnlockedCards } from './UnlockedCards';
import { cn } from '@/lib/cn';
import type {
  GamificationRewardLevelDto,
  UnlockedCardItemDto,
} from '@history-learning/shared';

export interface RewardSummaryProps {
  type: 'lesson' | 'quiz';
  expGained: number;
  totalExp?: number;
  leveledUp?: boolean;
  currentLevel?: GamificationRewardLevelDto | null;
  unlockedCharacters?: UnlockedCardItemDto[];
  unlockedEvents?: UnlockedCardItemDto[];
  variant?: 'card' | 'modal';
  className?: string;
}

export function RewardSummary({
  type,
  expGained,
  leveledUp,
  currentLevel,
  unlockedCharacters,
  unlockedEvents,
  variant = 'card',
  className,
}: RewardSummaryProps) {
  const hasExp = expGained > 0;
  const hasCharacters = Boolean(unlockedCharacters && unlockedCharacters.length > 0);
  const hasEvents = Boolean(unlockedEvents && unlockedEvents.length > 0);

  // Nếu không có EXP và không có thẻ mới mở khóa -> không hiển thị gì (tránh giả lập phần thưởng khi retake)
  if (!hasExp && !hasCharacters && !hasEvents) {
    return null;
  }

  // Quiz EXP breakdown theo đúng dữ liệu nhận từ backend
  const getQuizBreakdown = () => {
    if (type !== 'quiz' || !hasExp) return null;
    if (expGained === 40) {
      return 'Hoàn thành quiz (+10 EXP) và đạt điểm chuẩn (+30 EXP)';
    }
    if (expGained === 30) {
      return 'Đạt điểm chuẩn bài kiểm tra (+30 EXP)';
    }
    if (expGained === 10) {
      return 'Hoàn thành bài kiểm tra (+10 EXP)';
    }
    return `Đã tích lũy thêm +${expGained} EXP`;
  };

  const quizBreakdown = getQuizBreakdown();

  // Layout dành riêng cho RewardModal / Overlay
  if (variant === 'modal') {
    return (
      <div className={cn('space-y-4 text-center', className)}>
        {hasExp && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-bronze/15 border border-bronze/40 text-bronze-ink font-serif text-2xl font-bold shadow-sm">
              <span>+{expGained} EXP</span>
            </div>
            <p className="text-xs text-muted">
              {type === 'lesson'
                ? 'Điểm kinh nghiệm hoàn thành bài học'
                : 'Điểm kinh nghiệm bài kiểm tra'}
            </p>
          </div>
        )}

        {/* Thông báo thăng cấp nổi bật nếu có */}
        {leveledUp && currentLevel && (
          <div className="p-3.5 rounded-md bg-seal/10 border border-seal/30 text-seal space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-seal">
              <Award size={15} aria-hidden="true" />
              <span>Vinh danh thăng cấp</span>
            </div>
            <div className="font-serif text-lg font-bold tracking-tight text-seal">
              Chúc mừng bạn đã thăng cấp: {currentLevel.name} (Cấp {currentLevel.displayOrder})
            </div>
            <p className="text-xs text-seal/85">
              Bạn đã đạt mốc điểm kinh nghiệm mới trên con đường học sử!
            </p>
          </div>
        )}

        {/* Thẻ nhân vật & sự kiện mở khóa */}
        {(hasCharacters || hasEvents) && (
          <UnlockedCards
            characters={unlockedCharacters}
            events={unlockedEvents}
            className="text-left"
          />
        )}
      </div>
    );
  }

  // Layout mặc định dạng thẻ (Card) dùng trên trang kết quả Quiz
  return (
    <div
      role="region"
      aria-label="Phần thưởng học tập"
      className={cn(
        'rounded-md border border-bronze/40 bg-card p-4 md:p-5 shadow-card space-y-3.5 transition-all text-ink',
        className
      )}
    >
      {/* Tiêu đề & EXP Badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {type === 'lesson' ? (
            <div className="w-8 h-8 rounded-full bg-bronze/10 text-bronze-ink flex items-center justify-center shrink-0">
              <BookOpen size={16} aria-hidden="true" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-bronze/10 text-bronze-ink flex items-center justify-center shrink-0">
              <HelpCircle size={16} aria-hidden="true" />
            </div>
          )}
          <div>
            <div className="font-serif text-base font-bold text-ink tracking-tight">
              {type === 'lesson' ? 'Phần thưởng hoàn thành bài học' : 'Phần thưởng bài kiểm tra'}
            </div>
            {type === 'lesson' && hasExp && (
              <div className="text-xs text-muted">
                Bạn đã hoàn thành bài học và được cộng điểm kinh nghiệm
              </div>
            )}
            {quizBreakdown && (
              <div className="text-xs text-muted">{quizBreakdown}</div>
            )}
          </div>
        </div>

        {hasExp && (
          <div className="flex items-center gap-2">
            <Badge
              variant="warning"
              className="font-serif font-bold text-sm h-7 px-3 bg-bronze/15 text-bronze-ink border-bronze/40"
            >
              +{expGained} EXP
            </Badge>
          </div>
        )}
      </div>

      {/* Thông báo thăng cấp nổi bật nếu có */}
      {leveledUp && currentLevel && (
        <div className="flex items-center gap-2.5 p-3 rounded-md bg-seal/10 border border-seal/30 text-seal">
          <div className="w-8 h-8 rounded-full bg-seal/15 flex items-center justify-center shrink-0">
            <Award size={16} aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold">Vinh danh thăng cấp</div>
            <div className="font-serif text-sm font-bold">
              Chúc mừng bạn đã thăng cấp: {currentLevel.name} (Cấp {currentLevel.displayOrder})
            </div>
          </div>
        </div>
      )}

      {/* Thẻ nhân vật & sự kiện mở khóa (cho bài học) */}
      {(hasCharacters || hasEvents) && (
        <UnlockedCards characters={unlockedCharacters} events={unlockedEvents} />
      )}
    </div>
  );
}
