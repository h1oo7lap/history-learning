import React from 'react';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  questionIds: string[];
  answers: Record<string, string[]>;
  onSelectIndex: (index: number) => void;
  disabled?: boolean;
}

export function QuestionPalette({
  totalQuestions,
  currentIndex,
  questionIds,
  answers,
  onSelectIndex,
  disabled = false,
}: QuestionPaletteProps) {
  const answeredCount = questionIds.filter((id) => (answers[id]?.length ?? 0) > 0).length;

  return (
    <Card className="border-line shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-sans font-bold uppercase tracking-wider text-muted">
            Danh sách câu hỏi
          </CardTitle>
          <span className="text-xs font-medium text-ink">
            Đã làm <strong className="text-seal">{answeredCount}</strong>/{totalQuestions}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        <div
          role="navigation"
          aria-label="Danh sách câu hỏi bài quiz"
          className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2"
        >
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const qId = questionIds[idx];
            const isAnswered = qId ? (answers[qId]?.length ?? 0) > 0 : false;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => onSelectIndex(idx)}
                aria-label={`Câu hỏi số ${idx + 1}${isAnswered ? ', đã trả lời' : ', chưa trả lời'}${isCurrent ? ', đang chọn' : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
                className={cn(
                  'h-10 rounded-md border text-sm font-medium transition-all select-none flex items-center justify-center',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal focus-visible:ring-offset-1',
                  isCurrent && 'ring-2 ring-seal border-seal font-bold z-10',
                  !isCurrent && isAnswered && 'bg-seal/15 text-seal border-seal/30 hover:bg-seal/20',
                  !isCurrent && !isAnswered && 'bg-paper text-muted border-line hover:border-bronze hover:text-ink',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Chú giải trạng thái */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-line/60 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-seal/20 border border-seal/40" aria-hidden="true" />
            <span>Đã làm</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-paper border border-line" aria-hidden="true" />
            <span>Chưa làm</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border-2 border-seal" aria-hidden="true" />
            <span>Đang chọn</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
