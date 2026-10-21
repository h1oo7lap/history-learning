import { Injectable } from '@nestjs/common';
import {
  PublishStatus,
  ProgressStatus,
  QuestionType,
  PAGINATION,
  validateQuizQuestions,
} from '@history-learning/shared';
import type {
  CreateQuizDto,
  UpdateQuizDto,
  QuestionDto,
  SubmitQuizDto,
} from '@history-learning/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { paginate } from '../common/pagination/paginate';

const QUIZ_INCLUDE = {
  questions: {
    include: { answers: { orderBy: { displayOrder: 'asc' as const } } },
    orderBy: { displayOrder: 'asc' as const },
  },
  lesson: { select: { id: true, title: true, slug: true } },
} as const;

const QUIZ_LIST_SELECT = {
  id: true,
  lessonId: true,
  title: true,
  description: true,
  timeLimit: true,
  passScore: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  lesson: { select: { id: true, title: true, slug: true } },
  _count: { select: { questions: true } },
} as const;

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // Admin methods (unchanged)
  // =========================================================================

  async adminFindAll(query: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const pageSize = Math.min(query.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE, PAGINATION.MAX_PAGE_SIZE);
    const page = Math.max(query.page ?? 1, 1);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = {
      ...(query.status && query.status !== '' ? { status: query.status as PublishStatus } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quiz.findMany({ where, select: QUIZ_LIST_SELECT, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.quiz.count({ where }),
    ]);

    return paginate(items, total, { page, pageSize });
  }

  async adminFindOne(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id }, include: QUIZ_INCLUDE });
    if (!quiz) throw new AppError(ErrorCodes.QUIZ_NOT_FOUND, 404, 'Quiz khong ton tai');
    return quiz;
  }

  async adminCreate(dto: CreateQuizDto) {
    if (dto.status === PublishStatus.PUBLISHED) {
      throw new AppError(
        ErrorCodes.QUIZ_NO_QUESTIONS,
        422,
        'Quiz phải có ít nhất 1 câu hỏi hợp lệ để xuất bản',
      );
    }

    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new AppError(ErrorCodes.LESSON_NOT_FOUND, 404, 'Bai hoc khong ton tai');

    const existing = await this.prisma.quiz.findUnique({ where: { lessonId: dto.lessonId } });
    if (existing) throw new AppError(ErrorCodes.QUIZ_ALREADY_EXISTS, 409, 'Bai hoc nay da co quiz, moi bai hoc chi co 1 quiz');

    return this.prisma.quiz.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        description: dto.description ?? null,
        timeLimit: dto.timeLimit ?? null,
        passScore: dto.passScore ?? 60,
        status: dto.status ?? PublishStatus.DRAFT,
      },
      include: QUIZ_INCLUDE,
    });
  }

  async adminUpdate(id: string, dto: UpdateQuizDto) {
    await this.ensureExists(id);

    if (dto.lessonId !== undefined) {
      const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
      if (!lesson) throw new AppError(ErrorCodes.LESSON_NOT_FOUND, 404, 'Bai hoc khong ton tai');

      const existing = await this.prisma.quiz.findUnique({ where: { lessonId: dto.lessonId } });
      if (existing && existing.id !== id) {
        throw new AppError(ErrorCodes.QUIZ_ALREADY_EXISTS, 409, 'Bai hoc nay da co quiz');
      }
    }

    if (dto.status === PublishStatus.PUBLISHED) {
      await this.validatePublish(id);
    }

    return this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.lessonId !== undefined && { lessonId: dto.lessonId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.timeLimit !== undefined && { timeLimit: dto.timeLimit }),
        ...(dto.passScore !== undefined && { passScore: dto.passScore }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: QUIZ_INCLUDE,
    });
  }

  async adminDelete(id: string) {
    await this.ensureExists(id);
    try {
      await this.prisma.$transaction(async (tx) => {
        const attemptCount = tx.quizAttempt?.count
          ? await tx.quizAttempt.count({ where: { quizId: id } })
          : 0;
        if (attemptCount > 0) {
          throw new AppError(
            ErrorCodes.QUIZ_HAS_ATTEMPTS,
            409,
            'Không thể xóa quiz đã có lượt làm bài',
          );
        }
        await tx.quiz.delete({ where: { id } });
      });
    } catch (err: any) {
      if (err?.code === 'P2003') {
        throw new AppError(
          ErrorCodes.QUIZ_HAS_ATTEMPTS,
          409,
          'Không thể xóa quiz đã có lượt làm bài',
        );
      }
      throw err;
    }
  }

  async adminPublish(id: string) {
    await this.ensureExists(id);
    await this.validatePublish(id);
    return this.prisma.quiz.update({
      where: { id },
      data: { status: PublishStatus.PUBLISHED },
      include: QUIZ_INCLUDE,
    });
  }

  async adminSetQuestions(quizId: string, questions: QuestionDto[]) {
    await this.ensureExists(quizId);

    const valResult = validateQuizQuestions(questions);
    if (!valResult.success) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        valResult.errors.join('; '),
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const attemptCount = tx.quizAttempt?.count
          ? await tx.quizAttempt.count({ where: { quizId } })
          : 0;
        if (attemptCount > 0) {
          throw new AppError(
            ErrorCodes.QUIZ_HAS_ATTEMPTS,
            409,
            'Không thể thay đổi câu hỏi của quiz đã có lượt làm bài',
          );
        }

        await tx.question.deleteMany({ where: { quizId } });
        for (let qi = 0; qi < questions.length; qi++) {
          const q = questions[qi]!;
          await tx.question.create({
            data: {
              quizId,
              content: q.content,
              type: q.type,
              points: q.points ?? 1,
              explanation: q.explanation ?? null,
              displayOrder: q.displayOrder ?? qi,
              answers: {
                create: q.answers.map((a, ai) => ({
                  content: a.content,
                  isCorrect: a.isCorrect,
                  displayOrder: a.displayOrder ?? ai,
                })),
              },
            },
          });
        }
        return tx.quiz.findUnique({ where: { id: quizId }, include: QUIZ_INCLUDE });
      });
    } catch (err: any) {
      if (err?.code === 'P2003') {
        throw new AppError(
          ErrorCodes.QUIZ_HAS_ATTEMPTS,
          409,
          'Không thể thay đổi câu hỏi của quiz đã có lượt làm bài',
        );
      }
      throw err;
    }
  }

  async findPublishedByLessonId(lessonId: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { lessonId, status: PublishStatus.PUBLISHED },
      include: QUIZ_INCLUDE,
    });
    if (!quiz) throw new AppError(ErrorCodes.QUIZ_NOT_FOUND, 404, 'Quiz khong ton tai hoac chua xuat ban');
    return quiz;
  }

  private async validatePublish(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    if (!quiz) {
      throw new AppError(ErrorCodes.QUIZ_NOT_FOUND, 404, 'Quiz khong ton tai');
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      throw new AppError(
        ErrorCodes.QUIZ_NO_QUESTIONS,
        422,
        'Quiz phải có ít nhất 1 câu hỏi hợp lệ để xuất bản',
      );
    }

    const valResult = validateQuizQuestions(quiz.questions);
    if (!valResult.success) {
      throw new AppError(
        ErrorCodes.QUIZ_NO_QUESTIONS,
        422,
        `Quiz chưa thể xuất bản vì câu hỏi không hợp lệ: ${valResult.errors.join('; ')}`,
      );
    }
  }

  private async ensureExists(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id }, select: { id: true } });
    if (!quiz) throw new AppError(ErrorCodes.QUIZ_NOT_FOUND, 404, 'Quiz khong ton tai');
  }

  // =========================================================================
  // Student Quiz Methods (Q1 - Q15)
  // =========================================================================

  /**
   * Q13 & Q15: List published quizzes for students with LOCKED / AVAILABLE / DONE status.
   * Filters by user's grade from DB if queryGradeId is omitted, ?gradeId overrides,
   * returns all published if user has no grade and queryGradeId is omitted.
   * Avoids N+1 query via 3 batch queries.
   */
  async findStudentQuizzes(userId: string, userRole: string, queryGradeId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { gradeId: true },
    });
    const effectiveGradeId = queryGradeId ? queryGradeId : (user?.gradeId ?? undefined);

    const quizzes = await this.prisma.quiz.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        lesson: {
          status: PublishStatus.PUBLISHED,
          ...(effectiveGradeId ? { gradeId: effectiveGradeId } : {}),
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        timeLimit: true,
        lessonId: true,
        lesson: { select: { id: true, title: true, slug: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (quizzes.length === 0) {
      return [];
    }

    const lessonIds = quizzes.map((q) => q.lessonId);
    const progressList = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, status: true },
    });
    const completedLessonIdSet = new Set(
      progressList.filter((p) => p.status === ProgressStatus.COMPLETED).map((p) => p.lessonId),
    );

    const quizIds = quizzes.map((q) => q.id);
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId, quizId: { in: quizIds }, submittedAt: { not: null } },
      orderBy: { submittedAt: 'desc' },
      select: { quizId: true, score: true, totalScore: true, passed: true, submittedAt: true },
    });
    const latestAttemptMap = new Map<string, (typeof attempts)[0]>();
    for (const att of attempts) {
      if (!latestAttemptMap.has(att.quizId)) {
        latestAttemptMap.set(att.quizId, att);
      }
    }

    return quizzes.map((q) => {
      const latest = latestAttemptMap.get(q.id);
      let status: 'LOCKED' | 'AVAILABLE' | 'DONE';
      let lastAttempt: { score: number; totalScore: number; passed: boolean } | null = null;

      if (latest) {
        status = 'DONE';
        lastAttempt = {
          score: latest.score ?? 0,
          totalScore: latest.totalScore ?? 0,
          passed: latest.passed ?? false,
        };
      } else if (userRole === 'ADMIN' || completedLessonIdSet.has(q.lessonId)) {
        status = 'AVAILABLE';
      } else {
        status = 'LOCKED';
      }

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        timeLimit: q.timeLimit,
        questionCount: q._count.questions,
        lessonId: q.lessonId,
        lesson: q.lesson,
        status,
        lastAttempt,
      };
    });
  }

  /**
   * Q1, Q2, Q3, Q12: Start or reuse an open unexpired quiz attempt.
   */
  async startQuiz(userId: string, userRole: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: true,
        questions: {
          include: { answers: { orderBy: { displayOrder: 'asc' } } },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!quiz || quiz.status !== PublishStatus.PUBLISHED || quiz.lesson.status !== PublishStatus.PUBLISHED) {
      throw new AppError(ErrorCodes.QUIZ_NOT_PUBLISHED, 400, 'Quiz không tồn tại hoặc chưa xuất bản');
    }

    if (userRole !== 'ADMIN') {
      const progress = await this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: quiz.lessonId } },
      });
      if (!progress || progress.status !== ProgressStatus.COMPLETED) {
        throw new AppError(ErrorCodes.LESSON_NOT_COMPLETED, 403, 'Bạn cần hoàn thành bài học trước khi làm quiz');
      }
    }

    const serverTime = new Date();
    const openAttempt = await this.prisma.quizAttempt.findFirst({
      where: { userId, quizId, submittedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    let attempt = openAttempt;
    let isExpired = false;
    if (attempt && quiz.timeLimit) {
      const maxDurationMs = quiz.timeLimit * 1000;
      if (serverTime.getTime() - attempt.startedAt.getTime() > maxDurationMs) {
        isExpired = true;
      }
    }

    if (!attempt || isExpired) {
      attempt = await this.prisma.quizAttempt.create({
        data: {
          userId,
          quizId,
          startedAt: serverTime,
        },
      });
    }

    const expiresAt = quiz.timeLimit ? new Date(attempt.startedAt.getTime() + quiz.timeLimit * 1000) : null;

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      expiresAt,
      serverTime,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        content: q.content,
        type: q.type,
        points: q.points,
        displayOrder: q.displayOrder,
        answers: q.answers.map((a) => ({
          id: a.id,
          content: a.content,
          displayOrder: a.displayOrder,
        })),
      })),
    };
  }

  /**
   * Q4, Q5, Q6, Q7, Q8, Q9: Submit a quiz attempt with atomic lock and grading.
   */
  async submitQuiz(userId: string, quizId: string, dto: SubmitQuizDto) {
    // 1. Validation check for duplicate questionId or duplicate answerIds (Addition 1 / Q8)
    const seenQuestionIds = new Set<string>();
    for (const ans of dto.answers) {
      if (seenQuestionIds.has(ans.questionId)) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 400, 'Không được có câu hỏi trùng lặp trong danh sách trả lời');
      }
      seenQuestionIds.add(ans.questionId);

      const seenAnswerIds = new Set<string>();
      for (const aId of ans.answerIds) {
        if (seenAnswerIds.has(aId)) {
          throw new AppError(ErrorCodes.VALIDATION_ERROR, 400, 'Không được có đáp án trùng lặp trong một câu');
        }
        seenAnswerIds.add(aId);
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.findUnique({
        where: { id: dto.attemptId },
        include: { quiz: { include: { lesson: true } } },
      });

      if (!attempt || attempt.userId !== userId || attempt.quizId !== quizId) {
        throw new AppError(ErrorCodes.ATTEMPT_NOT_FOUND, 404, 'Lượt làm bài không tồn tại');
      }

      if (attempt.quiz.status !== PublishStatus.PUBLISHED || attempt.quiz.lesson.status !== PublishStatus.PUBLISHED) {
        throw new AppError(ErrorCodes.QUIZ_NOT_PUBLISHED, 400, 'Quiz không tồn tại hoặc chưa xuất bản');
      }

      // Idempotent return (Q5)
      if (attempt.submittedAt !== null) {
        return {
          attemptId: attempt.id,
          score: attempt.score!,
          totalScore: attempt.totalScore!,
          correctAnswers: attempt.correctAnswers!,
          totalQuestions: attempt.totalQuestions!,
          passed: attempt.passed!,
          submittedAt: attempt.submittedAt,
        };
      }

      const now = new Date(); // ONE now variable (Addition 4)

      // Q6: Time expired check (+10s grace period)
      if (attempt.quiz.timeLimit) {
        const maxAllowedMs = attempt.startedAt.getTime() + (attempt.quiz.timeLimit + 10) * 1000;
        if (now.getTime() > maxAllowedMs) {
          throw new AppError(ErrorCodes.QUIZ_TIME_EXPIRED, 400, 'Thời gian làm bài đã kết thúc');
        }
      }

      // Grade attempt (Q7-Q9)
      const grading = await this.gradeSubmission(tx, quizId, dto.answers);

      // Atomic lock (Q5)
      const updateRes = await tx.quizAttempt.updateMany({
        where: { id: dto.attemptId, submittedAt: null },
        data: {
          submittedAt: now,
          score: grading.score,
          totalScore: grading.totalScore,
          correctAnswers: grading.correctAnswers,
          totalQuestions: grading.totalQuestions,
          passed: grading.passed,
        },
      });

      // If count === 0: concurrent submit won race, return values from DB (Addition 4)
      if (updateRes.count === 0) {
        const alreadySubmitted = await tx.quizAttempt.findUniqueOrThrow({
          where: { id: dto.attemptId },
        });
        return {
          attemptId: alreadySubmitted.id,
          score: alreadySubmitted.score!,
          totalScore: alreadySubmitted.totalScore!,
          correctAnswers: alreadySubmitted.correctAnswers!,
          totalQuestions: alreadySubmitted.totalQuestions!,
          passed: alreadySubmitted.passed!,
          submittedAt: alreadySubmitted.submittedAt!,
        };
      }

      // Insert attempt answers in same transaction
      if (grading.attemptAnswersToInsert.length > 0) {
        await tx.quizAttemptAnswer.createMany({
          data: grading.attemptAnswersToInsert.map((a) => ({
            attemptId: dto.attemptId,
            questionId: a.questionId,
            answerId: a.answerId,
            isCorrect: a.isCorrect,
          })),
        });
      }

      return {
        attemptId: attempt.id,
        score: grading.score,
        totalScore: grading.totalScore,
        correctAnswers: grading.correctAnswers,
        totalQuestions: grading.totalQuestions,
        passed: grading.passed,
        submittedAt: now, // using same now variable
      };
    });
  }

  /**
   * Helper: Grade quiz questions and answers against database source of truth.
   */
  private async gradeSubmission(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    quizId: string,
    answers: SubmitQuizDto['answers'],
  ) {
    const questions = await tx.question.findMany({
      where: { quizId },
      include: { answers: true },
      orderBy: { displayOrder: 'asc' },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const answerToQuestionMap = new Map<string, string>();
    const answerIsCorrectMap = new Map<string, boolean>();

    for (const q of questions) {
      for (const a of q.answers) {
        answerToQuestionMap.set(a.id, q.id);
        answerIsCorrectMap.set(a.id, a.isCorrect);
      }
    }

    // Q8: Verify that submitted questionIds and answerIds belong to the quiz
    for (const ans of answers) {
      if (!questionMap.has(ans.questionId)) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 400, `Câu hỏi ${ans.questionId} không thuộc quiz`);
      }
      for (const aId of ans.answerIds) {
        if (!answerToQuestionMap.has(aId) || answerToQuestionMap.get(aId) !== ans.questionId) {
          throw new AppError(ErrorCodes.VALIDATION_ERROR, 400, `Đáp án ${aId} không thuộc câu hỏi`);
        }
      }
    }

    const submittedAnswersMap = new Map(answers.map((a) => [a.questionId, a.answerIds]));
    const totalScore = questions.reduce((sum, q) => sum + q.points, 0);
    const totalQuestions = questions.length;
    let score = 0;
    let correctAnswers = 0;
    const attemptAnswersToInsert: { questionId: string; answerId: string; isCorrect: boolean }[] = [];

    for (const q of questions) {
      const selected = submittedAnswersMap.get(q.id);
      if (!selected || selected.length === 0) {
        // Empty question: scores 0 points (Q8)
        continue;
      }

      for (const aId of selected) {
        attemptAnswersToInsert.push({
          questionId: q.id,
          answerId: aId,
          isCorrect: answerIsCorrectMap.get(aId) ?? false,
        });
      }

      let isCorrectQuestion = false;
      if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
        // Q7: SINGLE_CHOICE / TRUE_FALSE chọn đúng 1 đáp án
        if (selected.length === 1 && answerIsCorrectMap.get(selected[0]!)) {
          isCorrectQuestion = true;
        }
      } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
        // Q7: MULTIPLE_CHOICE đúng khi chọn đủ và không thừa (tất cả hoặc không)
        const correctIds = q.answers.filter((a) => a.isCorrect).map((a) => a.id);
        if (selected.length === correctIds.length && selected.every((id) => correctIds.includes(id))) {
          isCorrectQuestion = true;
        }
      }

      if (isCorrectQuestion) {
        score += q.points;
        correctAnswers += 1;
      }
    }

    const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
    const quiz = await tx.quiz.findUniqueOrThrow({
      where: { id: quizId },
      select: { passScore: true },
    });
    const passed = percentage >= quiz.passScore;

    return {
      score,
      totalScore,
      correctAnswers,
      totalQuestions,
      passed,
      attemptAnswersToInsert,
    };
  }

  /**
   * Q10: Review attempt with answers and explanations only after submission.
   */
  async getAttemptReview(userId: string, attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            lesson: { select: { id: true, title: true, slug: true } },
            questions: {
              include: { answers: { orderBy: { displayOrder: 'asc' } } },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt || attempt.userId !== userId) {
      throw new AppError(ErrorCodes.ATTEMPT_NOT_FOUND, 404, 'Lượt làm bài không tồn tại');
    }

    if (attempt.submittedAt === null) {
      throw new AppError(ErrorCodes.ATTEMPT_NOT_SUBMITTED, 400, 'Lượt làm bài chưa được nộp');
    }

    const userAnswersByQuestion = new Map<string, string[]>();
    for (const ans of attempt.answers) {
      const list = userAnswersByQuestion.get(ans.questionId) ?? [];
      list.push(ans.answerId);
      userAnswersByQuestion.set(ans.questionId, list);
    }

    const reviewQuestions = attempt.quiz.questions.map((q) => {
      const selectedAnswerIds = userAnswersByQuestion.get(q.id) ?? [];
      const correctAnswers = q.answers.filter((a) => a.isCorrect).map((a) => a.id);
      let isUserCorrect = false;

      if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
        isUserCorrect = selectedAnswerIds.length === 1 && correctAnswers.includes(selectedAnswerIds[0]!);
      } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
        isUserCorrect =
          selectedAnswerIds.length === correctAnswers.length &&
          selectedAnswerIds.every((id) => correctAnswers.includes(id));
      }

      return {
        id: q.id,
        content: q.content,
        type: q.type,
        points: q.points,
        explanation: q.explanation,
        displayOrder: q.displayOrder,
        answers: q.answers.map((a) => ({
          id: a.id,
          content: a.content,
          isCorrect: a.isCorrect,
          displayOrder: a.displayOrder,
        })),
        selectedAnswerIds,
        isUserCorrect,
      };
    });

    return {
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        score: attempt.score ?? 0,
        totalScore: attempt.totalScore ?? 0,
        correctAnswers: attempt.correctAnswers ?? 0,
        totalQuestions: attempt.totalQuestions ?? 0,
        passed: attempt.passed ?? false,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      },
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        passScore: attempt.quiz.passScore,
        timeLimit: attempt.quiz.timeLimit,
        lesson: attempt.quiz.lesson,
      },
      questions: reviewQuestions,
    };
  }
}