'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface QuizNavControlsProps {
  currentIndex: number;
  total: number;
  isSubmitting: boolean;
  isExpired: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmitClick: () => void;
}

export function QuizNavControls({
  currentIndex,
  total,
  isSubmitting,
  isExpired,
  onPrev,
  onNext,
  onSubmitClick,
}: QuizNavControlsProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= total - 1;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <Button
        type="button"
        variant="secondary"
        size="md"
        disabled={isFirst || isSubmitting}
        onClick={onPrev}
        className="gap-1.5"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Câu trước</span>
      </Button>

      {isLast ? (
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={isSubmitting || isExpired}
          onClick={onSubmitClick}
          className="gap-1.5"
        >
          <span>Hoàn thành & Nộp</span>
          <Send size={16} aria-hidden="true" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={isSubmitting}
          onClick={onNext}
          className="gap-1.5"
        >
          <span>Câu tiếp</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
