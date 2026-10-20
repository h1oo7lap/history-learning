import * as fs from 'fs';
import * as path from 'path';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { validateQuizQuestions } from '@history-learning/shared';

export async function seedQuizzes(
  prisma: PrismaClient,
  lessonSlugToIdMap?: Map<string, string>,
) {
  console.log('  Seeding quizzes from JSON files...');

  const quizzesDir = path.resolve(__dirname, 'quizzes');
  if (!fs.existsSync(quizzesDir)) {
    console.log('  No quizzes directory found, skipping.');
    return;
  }

  // Ensure lesson slug mapping
  let lessonMap = lessonSlugToIdMap;
  if (!lessonMap) {
    const allLessons = await prisma.lesson.findMany({
      select: { id: true, slug: true },
    });
    lessonMap = new Map(allLessons.map((l) => [l.slug, l.id]));
  }

  const files = fs
    .readdirSync(quizzesDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  let count = 0;

  for (const filename of files) {
    const filePath = path.join(quizzesDir, filename);
    const lessonSlug = path.basename(filename, '.json');

    // 1. Validate that the quiz has a corresponding lesson
    const lessonId = lessonMap.get(lessonSlug);
    if (!lessonId) {
      throw new Error(
        `[Lỗi File: ${filename}] Quiz không có bài học tương ứng. Trường "lessonSlug" ("${lessonSlug}") không tồn tại trong danh sách bài học.`,
      );
    }

    // 2. Parse JSON
    let rawContent: string;
    try {
      rawContent = fs.readFileSync(filePath, 'utf8');
    } catch (err: any) {
      throw new Error(`[Lỗi File: ${filename}] Không thể đọc file: ${err.message}`);
    }

    let quizData: any;
    try {
      quizData = JSON.parse(rawContent);
    } catch (err: any) {
      throw new Error(`[Lỗi File: ${filename}] Định dạng JSON không hợp lệ: ${err.message}`);
    }

    // 3. Validate required quiz fields
    if (!quizData.title || typeof quizData.title !== 'string' || !quizData.title.trim()) {
      throw new Error(`[Lỗi File: ${filename}] Thiếu trường bắt buộc "title".`);
    }

    if (
      quizData.passScore != null &&
      (typeof quizData.passScore !== 'number' ||
        quizData.passScore < 0 ||
        quizData.passScore > 100)
    ) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "passScore" phải là số trong khoảng từ 0 đến 100.`,
      );
    }

    if (
      quizData.timeLimit != null &&
      (typeof quizData.timeLimit !== 'number' || quizData.timeLimit <= 0)
    ) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "timeLimit" phải là số giây nguyên dương hoặc null.`,
      );
    }

    if (
      quizData.status &&
      !['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(quizData.status)
    ) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "status" không hợp lệ (phải là PUBLISHED, DRAFT hoặc ARCHIVED).`,
      );
    }

    // 4. Validate questions array constraints with validateQuizQuestions
    if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "questions" phải là mảng câu hỏi không rỗng.`,
      );
    }

    const qValidation = validateQuizQuestions(quizData.questions);
    if (!qValidation.success) {
      throw new Error(
        `[Lỗi File: ${filename}] Lỗi ràng buộc ở trường "questions": ${qValidation.errors.join('; ')}`,
      );
    }

    // 5. Upsert Quiz
    const existingQuiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          lessonId,
          title: quizData.title.trim(),
          description: quizData.description?.trim() || null,
          timeLimit: quizData.timeLimit ?? null,
          passScore: quizData.passScore ?? 60,
          status: quizData.status || 'PUBLISHED',
          questions: {
            create: quizData.questions.map((q: any) => ({
              content: q.content.trim(),
              type: q.type,
              points: q.points ?? 1,
              explanation: q.explanation?.trim() || null,
              displayOrder: q.displayOrder,
              answers: {
                create: q.answers.map((a: any) => ({
                  content: a.content.trim(),
                  isCorrect: Boolean(a.isCorrect),
                  displayOrder: a.displayOrder,
                })),
              },
            })),
          },
        },
      });
    } else {
      // Update Quiz metadata
      await prisma.quiz.update({
        where: { id: existingQuiz.id },
        data: {
          title: quizData.title.trim(),
          description: quizData.description?.trim() || null,
          timeLimit: quizData.timeLimit ?? null,
          passScore: quizData.passScore ?? 60,
          status: quizData.status || 'PUBLISHED',
        },
      });

      // Check if students have already attempted this quiz
      const attemptCount = await prisma.quizAttempt.count({
        where: { quizId: existingQuiz.id },
      });

      if (attemptCount === 0) {
        // Safe to recreate questions and answers cleanly
        await prisma.question.deleteMany({ where: { quizId: existingQuiz.id } });
        for (const q of quizData.questions) {
          await prisma.question.create({
            data: {
              quizId: existingQuiz.id,
              content: q.content.trim(),
              type: q.type,
              points: q.points ?? 1,
              explanation: q.explanation?.trim() || null,
              displayOrder: q.displayOrder,
              answers: {
                create: q.answers.map((a: any) => ({
                  content: a.content.trim(),
                  isCorrect: Boolean(a.isCorrect),
                  displayOrder: a.displayOrder,
                })),
              },
            },
          });
        }
      } else {
        // Preserve user attempts by updating questions & answers in-place
        for (const q of quizData.questions) {
          const existingQ = existingQuiz.questions.find(
            (eq) => eq.displayOrder === q.displayOrder,
          );
          if (existingQ) {
            await prisma.question.update({
              where: { id: existingQ.id },
              data: {
                content: q.content.trim(),
                type: q.type,
                points: q.points ?? 1,
                explanation: q.explanation?.trim() || null,
              },
            });

            for (const a of q.answers) {
              const existingA = existingQ.answers.find(
                (ea) => ea.displayOrder === a.displayOrder,
              );
              if (existingA) {
                await prisma.answer.update({
                  where: { id: existingA.id },
                  data: {
                    content: a.content.trim(),
                    isCorrect: Boolean(a.isCorrect),
                  },
                });
              } else {
                await prisma.answer.create({
                  data: {
                    questionId: existingQ.id,
                    content: a.content.trim(),
                    isCorrect: Boolean(a.isCorrect),
                    displayOrder: a.displayOrder,
                  },
                });
              }
            }
          } else {
            // New question added to quiz
            await prisma.question.create({
              data: {
                quizId: existingQuiz.id,
                content: q.content.trim(),
                type: q.type,
                points: q.points ?? 1,
                explanation: q.explanation?.trim() || null,
                displayOrder: q.displayOrder,
                answers: {
                  create: q.answers.map((a: any) => ({
                    content: a.content.trim(),
                    isCorrect: Boolean(a.isCorrect),
                    displayOrder: a.displayOrder,
                  })),
                },
              },
            });
          }
        }
      }
    }

    count++;
  }

  console.log(`  ✓ Seeded ${count} quizzes successfully`);
}
