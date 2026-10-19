'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { calculateRemainingSeconds, formatCountdown } from '@/lib/quiz';

export interface QuizTimerProps {
  expiresAt: Date | string | null | undefined;
  serverOffsetMs: number;
  onExpire: () => void;
  className?: string;
}

export function QuizTimer({
  expiresAt,
  serverOffsetMs,
  onExpire,
  className,
}: QuizTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    calculateRemainingSeconds(expiresAt, serverOffsetMs)
  );

  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const remaining = calculateRemainingSeconds(expiresAt, serverOffsetMs);
      setRemainingSeconds(remaining);

      // Kích hoạt nộp bài tự động khi đồng hồ về 0 (duy nhất 1 lần)
      if (remaining !== null && remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current();
      }
    };

    // Tinh ngay lan dau
    tick();

    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt, serverOffsetMs]);

  if (!expiresAt) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-line text-xs font-medium text-muted',
          className
        )}
      >
        <Clock size={14} aria-hidden="true" />
        <span>Không giới hạn</span>
      </div>
    );
  }

  const isUrgent = remainingSeconds !== null && remainingSeconds <= 60;
  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Thời gian còn lại: ${formatCountdown(remainingSeconds)}`}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-semibold transition-colors select-none',
        isUrgent
          ? 'bg-danger/10 border-danger text-danger animate-pulse'
          : 'bg-paper border-line text-ink',
        className
      )}
    >
      {isUrgent ? (
        <AlertTriangle size={16} className="text-danger shrink-0" aria-hidden="true" />
      ) : (
        <Clock size={16} className="text-muted shrink-0" aria-hidden="true" />
      )}
      <span className="font-mono text-base tracking-wider">
        {isExpired ? '00:00' : formatCountdown(remainingSeconds)}
      </span>
    </div>
  );
}
