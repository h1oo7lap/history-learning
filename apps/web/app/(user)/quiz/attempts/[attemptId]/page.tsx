'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Award, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { useAttemptReview } from '@/features/quizzes/hooks';
import { ReviewQuestionItem } from '@/features/quizzes/components/ReviewQuestionItem';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export default function QuizAttemptReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const { data: reviewData, isLoading, isError, refetch } = useAttemptReview(attemptId);

  // Trạng thái 1: Đang tải kết quả
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <Skeleton className="h-6 w-36" />
        <Card className="border-line">
          <CardHeader className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trạng thái 2: Lỗi không tìm thấy hoặc chưa nộp
  if (isError || !reviewData) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <ErrorState
          title="Không thể xem kết quả bài làm"
          description="Lượt làm bài không tồn tại, chưa được nộp hoặc bạn không có quyền truy cập."
          retryHref="/quiz"
          retryLabel="Về danh sách bài quiz"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { attempt, quiz, questions } = reviewData;
  const percentage = attempt.totalScore > 0
    ? Math.round((attempt.score / attempt.totalScore) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-10 px-4 space-y-8">
      {/* Nút quay lại */}
      <Link
        href="/quiz"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Về danh sách bài quiz</span>
      </Link>

      {/* Thẻ tổng kết điểm số & kết quả */}
      <Card className="border-line shadow-card overflow-hidden">
        <CardHeader className="border-b border-line/60 pb-5 space-y-3 bg-paper/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-bronze-ink bg-bronze/10 px-2.5 py-1 rounded-sm border border-bronze/20">
              <BookOpen size={13} aria-hidden="true" />
              <span>Bài học: {quiz.lesson.title}</span>
            </span>

            <Badge variant={attempt.passed ? 'success' : 'danger'} className="text-sm px-2.5 py-1">
              {attempt.passed ? (
                <>
                  <CheckCircle2 size={14} aria-hidden="true" className="mr-1" />
                  ĐẠT TIÊU CHUẨN
                </>
              ) : (
                <>
                  <XCircle size={14} aria-hidden="true" className="mr-1" />
                  CHƯA ĐẠT
                </>
              )}
            </Badge>
          </div>

          <CardTitle className="text-2xl md:text-3xl font-serif text-ink tracking-tight">
            Kết quả: {quiz.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Thống kê điểm số */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-md border border-line bg-paper">
              <div className="text-xs text-muted font-medium mb-1">Tổng điểm đạt được</div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-seal">
                {attempt.score} <span className="text-sm font-normal text-muted">/ {attempt.totalScore}</span>
              </div>
            </div>

            <div className="p-4 rounded-md border border-line bg-paper">
              <div className="text-xs text-muted font-medium mb-1">Tỷ lệ chính xác</div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-ink">
                {percentage}%
              </div>
              <div className="text-[11px] text-muted mt-0.5">
                (Điểm đạt yêu cầu: ≥ {quiz.passScore}%)
              </div>
            </div>

            <div className="p-4 rounded-md border border-line bg-paper">
              <div className="text-xs text-muted font-medium mb-1">Số câu trả lời đúng</div>
              <div className="font-serif text-2xl md:text-3xl font-bold text-success">
                {attempt.correctAnswers} <span className="text-sm font-normal text-muted">/ {attempt.totalQuestions}</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-line/60 flex flex-wrap items-center justify-between gap-3 bg-paper/30">
          <Button asChild variant="ghost" size="md">
            <Link href="/quiz">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Về danh sách</span>
            </Link>
          </Button>

          <Button asChild variant="primary" size="md" className="gap-2">
            <Link href={`/quiz/${quiz.id}`}>
              <RotateCcw size={16} aria-hidden="true" />
              <span>Làm lại bài thi này</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Danh sách từng câu hỏi và giải thích đáp án (Q10) */}
      <section aria-label="Chi tiết từng câu hỏi" className="space-y-5">
        <h2 className="font-serif text-xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Award size={20} className="text-seal" aria-hidden="true" />
          <span>Chi tiết câu trả lời và giải thích</span>
        </h2>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <ReviewQuestionItem
              key={question.id}
              question={question}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* Điều hướng chân trang */}
      <div className="flex items-center justify-between pt-6 border-t border-line">
        <Button asChild variant="secondary" size="md">
          <Link href="/quiz">Về danh sách bài quiz</Link>
        </Button>

        <Button asChild variant="primary" size="md" className="gap-2">
          <Link href={`/quiz/${quiz.id}`}>
            <RotateCcw size={16} aria-hidden="true" />
            <span>Làm lại bài thi</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
