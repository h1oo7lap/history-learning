'use client';

import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';
import type { UserLevelProgressDto } from '@history-learning/shared';
import { cn } from '@/lib/cn';

export interface LevelProgressProps {
  /**
   * Dữ liệu tiến trình cấp độ được backend tính toán từ bảng Level trong database.
   */
  level?: UserLevelProgressDto | null;
  /**
   * 'card': Khối đầy đủ chi tiết cho Dashboard / Profile / Drawer.
   * 'compact': Phiên bản nhỏ gọn cho Navbar Dropdown.
   */
  variant?: 'card' | 'compact';
  className?: string;
}

export function LevelProgress({
  level,
  variant = 'card',
  className,
}: LevelProgressProps) {
  if (!level) return null;

  const {
    currentLevel,
    nextLevel,
    totalExp,
    expInCurrentLevel,
    expNeededForNextLevel,
    expRemaining,
    progressPercentage,
    isMaxLevel,
  } = level;

  // Phiên bản nhỏ gọn (Compact) dùng trong dropdown menu
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'p-2.5 rounded-sm bg-paper/90 border border-line/80 space-y-2 text-ink select-none',
          className
        )}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-serif font-bold text-ink">
            <Award size={13} className="text-bronze-ink shrink-0" aria-hidden="true" />
            <span>
              Cấp {currentLevel.displayOrder}: {currentLevel.name}
            </span>
          </div>
          <span className="font-semibold text-bronze-ink">
            {totalExp.toLocaleString('vi-VN')} EXP
          </span>
        </div>

        {/* Thanh tiến trình */}
        <div className="w-full h-1.5 rounded-full bg-line/80 overflow-hidden">
          <div
            role="progressbar"
            aria-label="Tiến trình cấp độ"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isMaxLevel ? 'bg-seal' : 'bg-bronze'
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Thông tin mốc tiếp theo */}
        <div className="text-[11px] text-muted flex items-center justify-between">
          {isMaxLevel ? (
            <span className="text-seal font-medium flex items-center gap-1">
              <ShieldCheck size={11} aria-hidden="true" />
              Đã đạt cấp tối đa
            </span>
          ) : (
            <>
              <span>Cần thêm +{expRemaining} EXP</span>
              <span className="font-medium text-ink-soft">{nextLevel?.name}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Phiên bản thẻ đầy đủ (Card)
  return (
    <div
      role="region"
      aria-label="Tiến trình cấp độ người dùng"
      className={cn(
        'rounded-md border border-line bg-card p-4 shadow-card text-ink space-y-3',
        className
      )}
    >
      {/* Tiêu đề & Cấp độ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-bronze/10 text-bronze-ink flex items-center justify-center shrink-0 border border-bronze/20">
            <Award size={18} aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs text-muted font-medium">Cấp độ hiện tại</div>
            <div className="font-serif text-base font-bold text-ink tracking-tight">
              Cấp {currentLevel.displayOrder}: {currentLevel.name}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-serif font-bold text-base text-bronze-ink">
            {totalExp.toLocaleString('vi-VN')} EXP
          </div>
          <div className="text-[11px] text-muted">Tổng điểm tích lũy</div>
        </div>
      </div>

      {/* Thanh tiến trình EXP */}
      <div className="space-y-1.5">
        <div className="w-full h-2 rounded-full bg-line/80 overflow-hidden">
          <div
            role="progressbar"
            aria-label="Tiến trình thăng cấp"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isMaxLevel ? 'bg-seal' : 'bg-bronze'
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Chú thích tiến trình */}
        {isMaxLevel ? (
          <div className="flex items-center gap-1.5 text-xs text-seal font-medium pt-0.5">
            <ShieldCheck size={14} className="shrink-0" aria-hidden="true" />
            <span>Đã đạt cấp độ vinh dự cao nhất: {currentLevel.name}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-muted pt-0.5">
            <span>
              {expInCurrentLevel} / {expNeededForNextLevel} EXP ({progressPercentage}%)
            </span>
            <span>
              Cần thêm <strong className="text-ink font-semibold">{expRemaining} EXP</strong> để lên{' '}
              <strong className="text-bronze-ink font-semibold">{nextLevel?.name}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
