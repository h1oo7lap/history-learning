import React from 'react';
import Link from 'next/link';
import {
  Lock,
  Clock,
  HelpCircle,
  BookOpen,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { StudentQuizItemDto } from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatTimeLimit } from '@/lib/quiz';

export interface QuizCardProps {
  quiz: StudentQuizItemDto;
}

export function QuizCard({ quiz }: QuizCardProps) {
  const { status, lastAttempt } = quiz;

  return (
    <Card className="flex flex-col h-full transition-shadow duration-150 hover:shadow-pop">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          {/* Trạng thái bài quiz (Q13) */}
          {status === 'LOCKED' && (
            <Badge variant="neutral" className="gap-1">
              <Lock size={12} aria-hidden="true" />
              <span>Chưa mở</span>
            </Badge>
          )}

          {status === 'AVAILABLE' && (
            <Badge variant="warning" dot>
              <span>Sẵn sàng</span>
            </Badge>
          )}

          {status === 'DONE' && lastAttempt && (
            <Badge
              variant={lastAttempt.passed ? 'success' : 'danger'}
              className="gap-1"
            >
              {lastAttempt.passed ? (
                <CheckCircle2 size={12} aria-hidden="true" />
              ) : (
                <XCircle size={12} aria-hidden="true" />
              )}
              <span>{lastAttempt.passed ? 'Đã đạt' : 'Chưa đạt'}</span>
            </Badge>
          )}

          {/* Thời lượng làm bài */}
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Clock size={13} aria-hidden="true" />
            <span>{formatTimeLimit(quiz.timeLimit)}</span>
          </span>
        </div>

        <CardTitle className="line-clamp-2 hover:text-seal transition-colors">
          {status === 'LOCKED' ? (
            <span>{quiz.title}</span>
          ) : (
            <Link href={`/quiz/${quiz.id}`}>{quiz.title}</Link>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        {quiz.description ? (
          <p className="text-sm text-muted line-clamp-2 leading-relaxed">
            {quiz.description}
          </p>
        ) : (
          <div />
        )}

        {/* Thông tin số câu và điểm số lần trước */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <HelpCircle size={13} aria-hidden="true" />
            <span>{quiz.questionCount} câu hỏi</span>
          </span>

          {status === 'DONE' && lastAttempt && (
            <span className="font-medium text-ink">
              Điểm gần nhất:{' '}
              <strong className={lastAttempt.passed ? 'text-success' : 'text-danger'}>
                {lastAttempt.score}/{lastAttempt.totalScore}
              </strong>
            </span>
          )}
        </div>

        {/* Thông báo điều kiện mở khóa khi LOCKED (Q12) */}
        {status === 'LOCKED' && (
          <div className="rounded-md bg-paper border border-line p-2.5 text-xs text-ink-soft">
            <div className="flex items-start gap-1.5">
              <BookOpen size={14} className="shrink-0 text-bronze-ink mt-0.5" aria-hidden="true" />
              <span className="leading-snug">
                Cần học xong bài:{' '}
                <Link
                  href={`/lessons/${quiz.lesson.slug}`}
                  className="font-medium text-seal underline hover:text-seal-dark"
                >
                  {quiz.lesson.title}
                </Link>
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        {status === 'LOCKED' && (
          <Button asChild variant="secondary" size="sm" className="w-full gap-1.5">
            <Link href={`/lessons/${quiz.lesson.slug}`}>
              <span>Đến bài học</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </Button>
        )}

        {status === 'AVAILABLE' && (
          <Button asChild variant="primary" size="sm" className="w-full gap-1.5">
            <Link href={`/quiz/${quiz.id}`}>
              <span>Làm bài</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </Button>
        )}

        {status === 'DONE' && (
          <Button asChild variant="secondary" size="sm" className="w-full gap-1.5">
            <Link href={`/quiz/${quiz.id}`}>
              <RotateCcw size={14} aria-hidden="true" />
              <span>Làm lại bài</span>
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
