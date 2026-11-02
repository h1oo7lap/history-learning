import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PublishStatus, QuestionType } from '@history-learning/shared';

async function getAuthCookie(app: INestApplication, email: string): Promise<string> {
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1!', fullName: 'Gamification Student' });

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: 'Password1!' });

  const setCookieHeader = res.headers['set-cookie'];
  return Array.isArray(setCookieHeader) ? setCookieHeader[0] ?? '' : String(setCookieHeader ?? '');
}

describe('Gamification (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userCookie: string;
  let gradeId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());

    const level = await prisma.educationLevel.upsert({
      where: { code: 'PRIMARY_GAME_TEST' },
      create: { name: 'Tiểu học', code: 'PRIMARY_GAME_TEST', displayOrder: 1 },
      update: {},
    });

    const grade = await prisma.grade.upsert({
      where: { code: 'GRADE_4_GAME_TEST' },
      create: { educationLevelId: level.id, name: 'Lớp 4', code: 'GRADE_4_GAME_TEST', displayOrder: 1 },
      update: {},
    });
    gradeId = grade.id;

    // Seed test Levels if not present
    await prisma.level.upsert({
      where: { requiredExp: 0 },
      update: {},
      create: { name: 'Tân sinh', requiredExp: 0, displayOrder: 1 },
    });
    await prisma.level.upsert({
      where: { requiredExp: 100 },
      update: {},
      create: { name: 'Học trò', requiredExp: 100, displayOrder: 2 },
    });

    userCookie = await getAuthCookie(app, 'student-game@example.com');
  });

  afterAll(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE user_characters, user_events, exp_transactions CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE quiz_attempt_answers, quiz_attempts, answers, questions, quizzes CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE lesson_characters, lesson_events, lesson_progress, lessons CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE historical_characters, historical_events CASCADE`;
    await clearAuthTables(prisma);
    await app.close();
  });

  it('Flow 1: completes lesson, awards +20 EXP, unlocks Character & Event Cards, verifies /me/collection', async () => {
    // 1. Create character & event
    const character = await prisma.historicalCharacter.create({
      data: {
        name: 'Ngô Quyền',
        slug: 'ngo-quyen-game-test',
        shortDescription: 'Chủ tướng Bạch Đằng',
      },
    });

    const event = await prisma.historicalEvent.create({
      data: {
        name: 'Chiến thắng Bạch Đằng năm 938',
        slug: 'bach-dang-game-test',
        description: 'Đánh tan quân Nam Hán',
      },
    });

    // 2. Create published lesson with linked character and event
    const lesson = await prisma.lesson.create({
      data: {
        gradeId,
        title: 'Chiến thắng Bạch Đằng năm 938',
        slug: 'chien-thang-bach-dang-game-test',
        content: '<p>Nội dung lịch sử</p>',
        status: PublishStatus.PUBLISHED,
        characters: {
          create: [{ characterId: character.id, role: 'Chủ tướng' }],
        },
        events: {
          create: [{ eventId: event.id }],
        },
      },
    });

    // 3. Complete lesson
    const completeRes = await request(app.getHttpServer())
      .post(`/api/lessons/${lesson.id}/complete`)
      .set('Cookie', userCookie)
      .expect(201);

    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.data.reward).toBeDefined();
    expect(completeRes.body.data.reward.expGained).toBe(20);
    expect(completeRes.body.data.reward.totalExp).toBe(20);
    expect(completeRes.body.data.reward.unlockedCharacters).toEqual([
      expect.objectContaining({ name: 'Ngô Quyền', slug: 'ngo-quyen-game-test' }),
    ]);
    expect(completeRes.body.data.reward.unlockedEvents).toEqual([
      expect.objectContaining({ name: 'Chiến thắng Bạch Đằng năm 938', slug: 'bach-dang-game-test' }),
    ]);

    // 4. Check user profile reflects totalExp: 20
    const profileRes = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Cookie', userCookie)
      .expect(200);

    expect(profileRes.body.data.totalExp).toBe(20);

    // 5. Check personal collection endpoint
    const collectionRes = await request(app.getHttpServer())
      .get('/api/users/me/collection')
      .set('Cookie', userCookie)
      .expect(200);

    expect(collectionRes.body.success).toBe(true);
    expect(collectionRes.body.data.totalCharacters).toBe(1);
    expect(collectionRes.body.data.totalEvents).toBe(1);
    expect(collectionRes.body.data.totalCards).toBe(2);
    expect(collectionRes.body.data.characters[0].slug).toBe('ngo-quyen-game-test');
    expect(collectionRes.body.data.events[0].slug).toBe('bach-dang-game-test');

    // 6. Complete AGAIN (idempotency check)
    const repeatCompleteRes = await request(app.getHttpServer())
      .post(`/api/lessons/${lesson.id}/complete`)
      .set('Cookie', userCookie)
      .expect(201);

    expect(repeatCompleteRes.body.data.reward.expGained).toBe(0);
    expect(repeatCompleteRes.body.data.reward.totalExp).toBe(20);

    // Collection count must NOT increase
    const repeatCollectionRes = await request(app.getHttpServer())
      .get('/api/users/me/collection')
      .set('Cookie', userCookie)
      .expect(200);

    expect(repeatCollectionRes.body.data.totalCharacters).toBe(1);
    expect(repeatCollectionRes.body.data.totalEvents).toBe(1);
  });

  it('Flow 2: quiz completion (+10 EXP) and pass (+30 EXP), prevents farm on retake', async () => {
    // 1. Create lesson and quiz
    const lesson = await prisma.lesson.create({
      data: {
        gradeId,
        title: 'Bài quiz test',
        slug: 'bai-quiz-game-test',
        content: '<p>Nội dung</p>',
        status: PublishStatus.PUBLISHED,
      },
    });

    const quiz = await prisma.quiz.create({
      data: {
        lessonId: lesson.id,
        title: 'Quiz Bạch Đằng',
        status: PublishStatus.PUBLISHED,
        passScore: 60,
        questions: {
          create: [
            {
              content: 'Ngô Quyền đánh tan quân nào năm 938?',
              type: QuestionType.SINGLE_CHOICE,
              points: 1,
              answers: {
                create: [
                  { content: 'Nam Hán', isCorrect: true, displayOrder: 0 },
                  { content: 'Tống', isCorrect: false, displayOrder: 1 },
                ],
              },
            },
          ],
        },
      },
      include: {
        questions: { include: { answers: true } },
      },
    });

    const question = quiz.questions[0]!;
    const correctAnswer = question.answers.find((a) => a.isCorrect)!;

    // Student completes lesson first so quiz is available
    await request(app.getHttpServer())
      .post(`/api/lessons/${lesson.id}/complete`)
      .set('Cookie', userCookie)
      .expect(201);

    // Current totalExp after lesson completion (20 from flow 1 + 20 from this lesson = 40)
    const userBefore = await prisma.user.findFirst({ where: { email: 'student-game@example.com' } });
    const expBefore = userBefore!.totalExp;

    // 2. Start quiz attempt
    const startRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quiz.id}/start`)
      .set('Cookie', userCookie)
      .expect(201);

    const attemptId = startRes.body.data.attemptId;

    // 3. Submit quiz with correct answer (100% -> passes)
    const submitRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quiz.id}/submit`)
      .set('Cookie', userCookie)
      .send({
        attemptId,
        answers: [{ questionId: question.id, answerIds: [correctAnswer.id] }],
      })
      .expect(200);

    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.passed).toBe(true);
    expect(submitRes.body.data.reward).toBeDefined();
    // +10 completion + 30 pass = 40 EXP
    expect(submitRes.body.data.reward.expGained).toBe(40);
    expect(submitRes.body.data.reward.totalExp).toBe(expBefore + 40);

    // 4. Retake: Start a new attempt on the same quiz
    // Stale previous attempt is already submitted, so startQuiz will create a new attempt
    const retakeStartRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quiz.id}/start`)
      .set('Cookie', userCookie)
      .expect(201);

    const retakeAttemptId = retakeStartRes.body.data.attemptId;
    expect(retakeAttemptId).not.toBe(attemptId);

    // Submit retake attempt with 100% score again
    const retakeSubmitRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quiz.id}/submit`)
      .set('Cookie', userCookie)
      .send({
        attemptId: retakeAttemptId,
        answers: [{ questionId: question.id, answerIds: [correctAnswer.id] }],
      })
      .expect(200);

    expect(retakeSubmitRes.body.success).toBe(true);
    expect(retakeSubmitRes.body.data.passed).toBe(true);
    // Rewards should NOT be granted again
    expect(retakeSubmitRes.body.data.reward.expGained).toBe(0);
    expect(retakeSubmitRes.body.data.reward.totalExp).toBe(expBefore + 40);
  });
});
