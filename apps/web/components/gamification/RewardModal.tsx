'use client';

import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RewardSummary } from './RewardSummary';
import { cn } from '@/lib/cn';
import type { LessonRewardResultDto } from '@history-learning/shared';

export interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: LessonRewardResultDto | null;
  className?: string;
}

export function RewardModal({
  isOpen,
  onClose,
  reward,
  className,
}: RewardModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !reward) return null;

  const hasReward =
    reward.expGained > 0 ||
    (reward.unlockedCharacters && reward.unlockedCharacters.length > 0) ||
    (reward.unlockedEvents && reward.unlockedEvents.length > 0);

  if (!hasReward) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[1px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-lg border-2 border-bronze/40 bg-card p-6 md:p-8 shadow-pop space-y-5 animate-in zoom-in-95 duration-200 text-center relative',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-muted hover:text-ink transition-colors p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal"
          aria-label="Đóng bảng phần thưởng"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Tiêu đề trang trọng phong cách sử học */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-seal uppercase tracking-widest">
            <Sparkles size={14} className="text-seal" aria-hidden="true" />
            <span>✦ HOÀN THÀNH BÀI HỌC ✦</span>
          </div>
          <h3
            id="reward-modal-title"
            className="font-serif text-xl md:text-2xl font-bold text-ink tracking-tight"
          >
            Chiến tích sử học
          </h3>
        </div>

        {/* Tái sử dụng RewardSummary làm nội dung phần thưởng với variant="modal" */}
        <RewardSummary
          type="lesson"
          variant="modal"
          expGained={reward.expGained}
          totalExp={reward.totalExp}
          leveledUp={reward.leveledUp}
          currentLevel={reward.currentLevel}
          unlockedCharacters={reward.unlockedCharacters}
          unlockedEvents={reward.unlockedEvents}
        />

        {/* Nút đóng/tiếp tục trang nhã */}
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onClose}
            className="w-full sm:w-auto min-w-[140px] mx-auto shadow-sm"
          >
            <span>Tuyệt!</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

