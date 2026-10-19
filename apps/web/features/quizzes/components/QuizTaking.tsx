'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { StartQuizResponseDto, SubmitAnswerDto } from '../api';
import { quizzesApi } from '../api';
import { ApiClientError } from '@/lib/api-client';
import { QuestionCard } from './QuestionCard';
import { QuestionPalette } from './QuestionPalette';
import { QuizHeader } from './QuizHeader';
import { QuizNavControls } from './QuizNavControls';
import { SubmitConfirmDialog } from './SubmitConfirmDialog';
import {
  toggleAnswer,
  countAnsweredQuestions,
  saveDraftAnswers,
  loadDraftAnswers,
  clearDraftAnswers,
} from '@/lib/quiz';

export interface QuizTakingProps {
  quizId: string;
  attemptData: StartQuizResponseDto;
  onSubmitted: (attemptId: string) => void;
  onExpired: () => void;
}

export function QuizTaking({
  quizId,
  attemptData,
  onSubmitted,
  onExpired,
}: QuizTakingProps) {
  const { questions, attemptId, serverTime, expiresAt } = attemptData;
  const total = questions.length;

  // Tính server offset một lần khi mount
  const [serverOffsetMs] = useState(() => new Date(serverTime).getTime() - Date.now());

  // Khôi phục bản nháp từ server (Adjustment 1)
  const [answers, setAnswers] = useState<Record<string, string[]>>(() => {
    const validQuestionMap = new Map<string, Set<string>>(
      questions.map((q) => [q.id, new Set(q.answers.map((a) => a.id))])
    );
    return loadDraftAnswers(attemptId, validQuestionMap);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Ref chống nộp đúp (Adjustment 2) và giữ answers mới nhất
  const submittingRef = useRef(false);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Lưu draft mỗi khi answers thay đổi
  const handleSelectAnswer = useCallback(
    (answerId: string) => {
      if (isExpired || submittingRef.current) return;

      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      setAnswers((prev) => {
        const nextAnswers = {
          ...prev,
          [currentQ.id]: toggleAnswer(prev[currentQ.id], answerId, currentQ.type),
        };
        saveDraftAnswers(attemptId, nextAnswers);
        return nextAnswers;
      });
    },
    [currentIndex, isExpired, questions, attemptId]
  );

  // Chuyển đổi answers sang định dạng API
  const buildSubmitPayload = useCallback((): SubmitAnswerDto[] => {
    const current = answersRef.current;
    return questions
      .filter((q) => (current[q.id]?.length ?? 0) > 0)
      .map((q) => ({
        questionId: q.id,
        answerIds: current[q.id]!,
      }));
  }, [questions]);

  // Nộp bài thực tế lên server (Q4, Q5)
  const executeSubmit = useCallback(
    async (isAuto: boolean): Promise<boolean> => {
      try {
        const payload = buildSubmitPayload();
        const res = await quizzesApi.submitQuiz(quizId, {
          attemptId,
          answers: payload,
        });

        clearDraftAnswers(attemptId);
        if (!isAuto) toast.success('Nộp bài thành công!');
        onSubmitted(res.attemptId);
        return true;
      } catch (err: unknown) {
        if (err instanceof ApiClientError && err.errorCode === 'QUIZ_TIME_EXPIRED') {
          clearDraftAnswers(attemptId);
          toast.error('Thời gian làm bài đã quá hạn.');
          onExpired();
          return true;
        }
        throw err;
      }
    },
    [buildSubmitPayload, quizId, attemptId, onSubmitted, onExpired]
  );

  // Nộp tự động khi hết giờ (Adjustment 3 & 7)
  const handleAutoSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsExpired(true);
    setShowConfirmDialog(false);

    toast.info('Hết giờ làm bài! Đang tự động gửi bài làm...');

    // Thử nộp bài tối đa 3 lần trong khoảng 10 giây ân hạn nếu mất mạng
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        success = await executeSubmit(true);
        if (success) break;
      } catch {
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    if (!success) {
      submittingRef.current = false;
      setIsSubmitting(false);
      toast.error('Không thể tự động nộp do lỗi mạng. Vui lòng bấm Nộp bài lại.');
    }
  }, [executeSubmit]);

  // Nộp thủ công khi người dùng bấm xác nhận
  const handleManualSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await executeSubmit(false);
    } catch (err: unknown) {
      submittingRef.current = false;
      setIsSubmitting(false);

      if (err instanceof ApiClientError) {
        toast.error(err.message || 'Không thể nộp bài. Vui lòng thử lại.');
      } else {
        toast.error('Lỗi kết nối máy chủ. Đáp án đã được lưu tạm.');
      }
    }
  };

  const questionIds = questions.map((q) => q.id);
  const { answered, unanswered } = countAnsweredQuestions(questionIds, answers);
  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) return null;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Thanh header điều khiển: Timer và nút nộp */}
      <QuizHeader
        answered={answered}
        total={total}
        expiresAt={expiresAt}
        serverOffsetMs={serverOffsetMs}
        onExpire={handleAutoSubmit}
        onSubmitClick={() => setShowConfirmDialog(true)}
        disabled={isSubmitting || isExpired}
      />

      {/* Bố cục 2 cột: Câu hỏi chính và Bảng số câu (Palette) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={total}
            selectedAnswerIds={answers[currentQuestion.id]}
            onSelectAnswer={handleSelectAnswer}
            disabled={isSubmitting || isExpired}
          />

          {/* Điều hướng câu trước / câu sau */}
          <QuizNavControls
            currentIndex={currentIndex}
            total={total}
            isSubmitting={isSubmitting}
            isExpired={isExpired}
            onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
            onSubmitClick={() => setShowConfirmDialog(true)}
          />
        </div>

        {/* Cột bên phải: Question Palette */}
        <div className="lg:col-span-1">
          <QuestionPalette
            totalQuestions={total}
            currentIndex={currentIndex}
            questionIds={questionIds}
            answers={answers}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Hộp thoại xác nhận nộp bài (Q8) */}
      <SubmitConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleManualSubmit}
        totalQuestions={total}
        unansweredCount={unanswered}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
