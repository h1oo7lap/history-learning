'use client';

import React, { useEffect } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface SubmitConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  unansweredCount: number;
  isSubmitting: boolean;
}

export function SubmitConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  unansweredCount,
  isSubmitting,
}: SubmitConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const hasUnanswered = unansweredCount > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md rounded-lg border border-line bg-card p-6 shadow-pop space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              hasUnanswered ? 'bg-danger/10 text-danger' : 'bg-bronze/10 text-bronze-ink'
            }`}
          >
            {hasUnanswered ? (
              <AlertCircle size={22} aria-hidden="true" />
            ) : (
              <HelpCircle size={22} aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1">
            <h3 id="submit-dialog-title" className="font-serif text-lg font-bold text-ink">
              {hasUnanswered ? 'Xác nhận nộp bài thi?' : 'Hoàn thành bài làm?'}
            </h3>
            <p className="text-sm text-muted leading-relaxed">
              {hasUnanswered ? (
                <>
                  Bạn vẫn còn <strong className="text-danger font-semibold">{unansweredCount}</strong> / {totalQuestions} câu hỏi chưa trả lời. Các câu bỏ trống sẽ bị tính 0 điểm (theo quy chế).
                </>
              ) : (
                'Bạn đã hoàn thành tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài để xem kết quả đánh giá?'
              )}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-line/60 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Tiếp tục làm bài
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            Xác nhận nộp bài
          </Button>
        </div>
      </div>
    </div>
  );
}
