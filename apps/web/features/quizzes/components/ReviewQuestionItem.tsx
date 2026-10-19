import React from 'react';
import { CheckCircle2, XCircle, BookOpen, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { QuizAttemptReviewQuestionDto } from '../api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ReviewQuestionItemProps {
  question: QuizAttemptReviewQuestionDto;
  index: number;
}

export function ReviewQuestionItem({ question, index }: ReviewQuestionItemProps) {
  const { isUserCorrect, selectedAnswerIds, answers, points, explanation } = question;
  const isSkipped = selectedAnswerIds.length === 0;

  return (
    <Card className="border-line shadow-card overflow-hidden">
      <CardHeader className="pb-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-ink text-base">
              Câu {index + 1}
            </span>

            {isUserCorrect ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 size={12} aria-hidden="true" />
                <span>Trả lời đúng</span>
              </Badge>
            ) : isSkipped ? (
              <Badge variant="neutral">
                Chưa trả lời (0 điểm)
              </Badge>
            ) : (
              <Badge variant="danger" className="gap-1">
                <XCircle size={12} aria-hidden="true" />
                <span>Trả lời sai</span>
              </Badge>
            )}
          </div>

          <span className="text-xs font-semibold text-muted">
            {isUserCorrect ? points : 0} / {points} điểm
          </span>
        </div>

        <CardTitle className="font-serif text-base md:text-lg font-medium text-ink leading-relaxed">
          {question.content}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Danh sách các đáp án kèm đối chiếu đúng/sai */}
        <div className="space-y-2.5">
          {answers.map((ans, aIdx) => {
            const isSelected = selectedAnswerIds.includes(ans.id);
            const isCorrect = ans.isCorrect;
            const letter = String.fromCharCode(65 + aIdx);

            let borderStyle = 'border-line bg-paper text-ink-soft';
            let indicator = null;

            if (isCorrect && isSelected) {
              borderStyle = 'border-success/60 bg-success/10 text-success font-medium';
              indicator = (
                <span className="inline-flex items-center gap-1 text-xs text-success font-semibold shrink-0">
                  <Check size={14} /> Bạn đã chọn đúng
                </span>
              );
            } else if (isCorrect && !isSelected) {
              borderStyle = 'border-success/60 bg-success/5 text-success font-medium';
              indicator = (
                <span className="inline-flex items-center gap-1 text-xs text-success font-semibold shrink-0">
                  <Check size={14} /> Đáp án đúng
                </span>
              );
            } else if (!isCorrect && isSelected) {
              borderStyle = 'border-danger/60 bg-danger/10 text-danger font-medium';
              indicator = (
                <span className="inline-flex items-center gap-1 text-xs text-danger font-semibold shrink-0">
                  <X size={14} /> Lựa chọn của bạn
                </span>
              );
            }

            return (
              <div
                key={ans.id}
                className={cn(
                  'p-3.5 rounded-md border text-sm flex items-start justify-between gap-3 select-none leading-relaxed',
                  borderStyle
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-6 h-6 rounded-md bg-line/60 text-ink-soft shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">
                    {letter}
                  </span>
                  <span className="pt-0.5">{ans.content}</span>
                </div>

                {indicator}
              </div>
            );
          })}
        </div>

        {/* Khối giải thích chi tiết (Q10) */}
        {explanation && (
          <div className="rounded-md bg-paper border border-line p-3.5 text-xs text-ink-soft space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-bronze-ink">
              <BookOpen size={14} aria-hidden="true" />
              <span>Giải thích đáp án:</span>
            </div>
            <p className="text-muted leading-relaxed pl-5">{explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
