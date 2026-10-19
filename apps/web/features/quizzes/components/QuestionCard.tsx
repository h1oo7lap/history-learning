import React from 'react';
import { QuestionType } from '@history-learning/shared';
import { Check, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { isAnswerSelected } from '@/lib/quiz';

export interface QuestionCardAnswer {
  id: string;
  content: string;
  displayOrder: number;
}

export interface QuestionCardQuestion {
  id: string;
  content: string;
  type: QuestionType;
  points: number;
  displayOrder: number;
  answers: QuestionCardAnswer[];
}

export interface QuestionCardProps {
  question: QuestionCardQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswerIds?: string[];
  onSelectAnswer: (answerId: string) => void;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswerIds = [],
  onSelectAnswer,
  disabled = false,
}: QuestionCardProps) {
  const isMultiple = question.type === QuestionType.MULTIPLE_CHOICE;
  const isTrueFalse = question.type === QuestionType.TRUE_FALSE;

  return (
    <Card className="border-line shadow-card">
      <CardHeader className="pb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-seal text-base md:text-lg">
              Câu {questionNumber} / {totalQuestions}
            </span>

            {isMultiple && (
              <Badge variant="warning">
                Chọn nhiều đáp án
              </Badge>
            )}

            {isTrueFalse && (
              <Badge variant="default">
                Đúng / Sai
              </Badge>
            )}

            {!isMultiple && !isTrueFalse && (
              <Badge variant="default">
                Chọn 1 đáp án
              </Badge>
            )}
          </div>

          <span className="text-xs text-muted font-medium">
            {question.points} {question.points === 1 ? 'điểm' : 'điểm'}
          </span>
        </div>

        <CardTitle className="font-serif text-lg md:text-xl font-medium text-ink leading-relaxed">
          {question.content}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        <div
          role={isMultiple ? 'group' : 'radiogroup'}
          aria-label={`Các đáp án cho câu hỏi ${questionNumber}`}
          className="space-y-3"
        >
          {question.answers.map((answer, index) => {
            const isSelected = isAnswerSelected(selectedAnswerIds, answer.id);
            const letterPrefix = String.fromCharCode(65 + index); // A, B, C, D...

            return (
              <button
                key={answer.id}
                type="button"
                role={isMultiple ? 'checkbox' : 'radio'}
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onSelectAnswer(answer.id)}
                className={cn(
                  'w-full min-h-[52px] p-3.5 md:p-4 rounded-md border text-left flex items-start gap-3.5 transition-all select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-seal bg-seal/5 shadow-sm text-ink'
                    : 'border-line bg-card hover:bg-paper hover:border-bronze text-ink-soft',
                  disabled && 'opacity-60 cursor-not-allowed'
                )}
              >
                {/* Ký hiệu A, B, C hoặc Icon chọn */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-md shrink-0 flex items-center justify-center font-bold text-xs transition-colors mt-0.5',
                    isSelected
                      ? 'bg-seal text-paper'
                      : 'bg-line/50 text-muted border border-line'
                  )}
                  aria-hidden="true"
                >
                  {isMultiple ? (
                    isSelected ? <CheckSquare size={16} /> : <Square size={16} />
                  ) : (
                    <span>{letterPrefix}</span>
                  )}
                </div>

                {/* Nội dung đáp án */}
                <span className="text-sm md:text-base leading-relaxed flex-1 pt-0.5">
                  {answer.content}
                </span>

                {/* Dấu check hiển thị cho câu 1 lựa chọn khi đã chọn */}
                {!isMultiple && isSelected && (
                  <span className="text-seal shrink-0 mt-1" aria-hidden="true">
                    <Check size={18} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
