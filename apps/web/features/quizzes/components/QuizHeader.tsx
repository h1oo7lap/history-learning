'use client';

import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QuizTimer } from './QuizTimer';

export interface QuizHeaderProps {
  answered: number;
  total: number;
  expiresAt: Date | string | null | undefined;
  serverOffsetMs: number;
  onExpire: () => void;
  onSubmitClick: () => void;
  disabled: boolean;
}

export function QuizHeader({
  answered,
  total,
  expiresAt,
  serverOffsetMs,
  onExpire,
  onSubmitClick,
  disabled,
}: QuizHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-lg bg-card border border-line shadow-card">
      <div className="flex items-center gap-2">
        <span className="font-serif font-bold text-ink text-base md:text-lg">
          Đang làm bài
        </span>
        <span className="text-xs text-muted">
          ({answered}/{total} câu)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <QuizTimer
          expiresAt={expiresAt}
          serverOffsetMs={serverOffsetMs}
          onExpire={onExpire}
        />

        <Button
          type="button"
          variant="primary"
          size="sm"
          className="gap-1.5"
          disabled={disabled}
          onClick={onSubmitClick}
        >
          <Send size={14} aria-hidden="true" />
          <span>Nộp bài</span>
        </Button>
      </div>
    </div>
  );
}
