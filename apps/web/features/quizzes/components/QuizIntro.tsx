import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import type { StudentQuizItemDto } from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatTimeLimit } from '@/lib/quiz';

export interface QuizIntroProps {
  quiz: StudentQuizItemDto;
  onStart: () => void;
  isStarting: boolean;
  errorCode?: string | null;
}

export function QuizIntro({ quiz, onStart, isStarting, errorCode }: QuizIntroProps) {
  const isLessonLocked = errorCode === 'LESSON_NOT_COMPLETED' || quiz.status === 'LOCKED';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/quiz"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6 transition-colors"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Về danh sách bài quiz</span>
      </Link>

      <Card className="border-line shadow-card">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-bronze-ink bg-bronze/10 px-2.5 py-1 rounded-sm border border-bronze/20">
              <BookOpen size={13} aria-hidden="true" />
              <span>Bài học: {quiz.lesson.title}</span>
            </span>

            {quiz.lastAttempt && (
              <Badge variant={quiz.lastAttempt.passed ? 'success' : 'danger'}>
                {quiz.lastAttempt.passed ? 'Lần trước: Đạt' : 'Lần trước: Chưa đạt'} (
                {quiz.lastAttempt.score}/{quiz.lastAttempt.totalScore}đ)
              </Badge>
            )}
          </div>

          <CardTitle className="text-2xl md:text-3xl font-serif text-ink tracking-tight">
            {quiz.title}
          </CardTitle>

          {quiz.description && (
            <p className="text-sm md:text-base text-muted leading-relaxed">
              {quiz.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Lưới các quy định của bài quiz */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border border-line bg-paper p-3.5 text-center">
              <div className="w-8 h-8 rounded-full bg-line/60 mx-auto flex items-center justify-center text-ink-soft mb-2">
                <HelpCircle size={16} aria-hidden="true" />
              </div>
              <div className="text-xs text-muted">Số câu hỏi</div>
              <div className="font-serif text-lg font-bold text-ink mt-0.5">
                {quiz.questionCount} câu
              </div>
            </div>

            <div className="rounded-md border border-line bg-paper p-3.5 text-center">
              <div className="w-8 h-8 rounded-full bg-line/60 mx-auto flex items-center justify-center text-ink-soft mb-2">
                <Clock size={16} aria-hidden="true" />
              </div>
              <div className="text-xs text-muted">Thời gian làm</div>
              <div className="font-serif text-lg font-bold text-ink mt-0.5">
                {formatTimeLimit(quiz.timeLimit)}
              </div>
            </div>

            <div className="rounded-md border border-line bg-paper p-3.5 text-center">
              <div className="w-8 h-8 rounded-full bg-line/60 mx-auto flex items-center justify-center text-ink-soft mb-2">
                <Award size={16} aria-hidden="true" />
              </div>
              <div className="text-xs text-muted">Điều kiện đạt</div>
              <div className="font-serif text-lg font-bold text-ink mt-0.5">
                ≥ 80% điểm
              </div>
            </div>
          </div>

          {/* Lưu ý quy định làm bài */}
          <div className="rounded-md bg-paper border border-line/80 p-4 text-xs text-muted space-y-1.5 leading-relaxed">
            <div className="font-medium text-ink-soft">Lưu ý trước khi làm bài:</div>
            <ul className="list-disc list-inside space-y-1 text-ink-soft">
              <li>
                Nếu bài có thời gian, đồng hồ sẽ bắt đầu tính ngay khi bạn bấm nút &quot;Bắt đầu&quot;.
              </li>
              <li>
                Đáp án được tự động lưu tạm trên trình duyệt nếu bạn vô tình tải lại trang.
              </li>
              <li>
                Hệ thống sẽ tự động nộp bài khi hết giờ nếu bạn chưa kịp nhấn nộp.
              </li>
            </ul>
          </div>

          {/* Cảnh báo chưa hoàn thành bài học (Q12 / Adjustment 4) */}
          {isLessonLocked && (
            <div className="rounded-md bg-danger/10 border border-danger/30 p-4 text-sm text-danger flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-2 flex-1">
                <div className="font-semibold">Bạn chưa hoàn thành bài học này!</div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Quy tắc học tập yêu cầu bạn cần học xong và hoàn thành bài đọc trước khi làm bài kiểm tra.
                </p>
                <div>
                  <Button asChild variant="secondary" size="sm" className="gap-1.5">
                    <Link href={`/lessons/${quiz.lesson.slug}`}>
                      <span>Đến bài học: {quiz.lesson.title}</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-4 border-t border-line/60 flex flex-col sm:flex-row gap-3">
          <Button asChild variant="ghost" size="md" className="w-full sm:w-auto">
            <Link href="/quiz">Quay lại</Link>
          </Button>

          {!isLessonLocked && (
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:flex-1 gap-2"
              onClick={onStart}
              loading={isStarting}
            >
              {quiz.status === 'DONE' ? (
                <>
                  <RotateCcw size={18} aria-hidden="true" />
                  <span>Làm lại bài thi</span>
                </>
              ) : (
                <>
                  <span>Bắt đầu làm bài</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
