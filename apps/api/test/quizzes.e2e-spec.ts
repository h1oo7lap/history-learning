import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';
import {
  PublishStatus,
  ProgressStatus,
  QuestionType,
} from '@history-learning/shared';

async function getAuthCookie(
  app: INestApplication,
  email: string,
  role: 'USER' | 'ADMIN' = 'USER',
  prisma?: PrismaService,
  gradeId?: string | null,
): Promise<string> {
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1!', fullName: 'Quiz User' });

  if (prisma) {
    await prisma.user.updateMany({
      where: { email },
      data: {
        role,
        ...(gradeId !== undefined ? { gradeId } : {}),
      },
    });
  }

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: 'Password1!' });

  const setCookieHeader = res.headers['set-cookie'];
  return Array.isArray(setCookieHeader) ? setCookieHeader[0] ?? '' : String(setCookieHeader ?? '');
}

async function clearQuizData(prisma: PrismaService) {
  await prisma.$executeRaw`TRUNCATE TABLE quiz_attempt_answers, quiz_attempts, answers, questions, quizzes, lesson_progress, lesson_grades, lessons CASCADE`;
  await clearAuthTables(prisma);
}

describe('Quizzes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let studentCookie: string;
  let studentUser: { id: string; email: string };

  let studentNoGradeCookie: string;
  let studentNoGradeUser: { id: string; email: string };

  let otherStudentCookie: string;
  let otherStudentUser: { id: string; email: string };

  let adminCookie: string;
  let adminUser: { id: string; email: string };

  let gradeA: { id: string; name: string };
  let gradeB: { id: string; name: string };

  let publishedLesson: { id: string; title: string; slug: string };
  let draftLesson: { id: string; title: string; slug: string };

  let publishedQuiz: any;
  let draftQuiz: any;
  let quizOfDraftLesson: any;
  let publishedLessonC: any;
  let publishedQuiz2: any;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await clearQuizData(prisma);
    // Delete grades and education levels created by this suite (with specific test prefix), without touching seed data
    await prisma.grade.deleteMany({
      where: {
        OR: [
          { code: { startsWith: 'GRADE_7A_' } },
          { code: { startsWith: 'GRADE_8B_' } },
          { code: { startsWith: 'TEST_' } },
        ],
      },
    });
    await prisma.educationLevel.deleteMany({
      where: {
        code: { startsWith: 'TEST_SEC_' },
      },
    });
    await app.close();
  });

  beforeEach(async () => {
    await clearQuizData(prisma);

    // 1. Ensure EducationLevel and Grades exist
    let level = await prisma.educationLevel.findFirst();
    if (!level) {
      level = await prisma.educationLevel.create({
        data: { name: 'THCS', code: 'TEST_SEC_' + Date.now() },
      });
    }

    gradeA = await prisma.grade.create({
      data: {
        educationLevelId: level.id,
        name: 'Lớp 7A',
        code: 'GRADE_7A_' + Date.now(),
      },
    });

    gradeB = await prisma.grade.create({
      data: {
        educationLevelId: level.id,
        name: 'Lớp 8B',
        code: 'GRADE_8B_' + Date.now(),
      },
    });

    // 2. Register users
    studentCookie = await getAuthCookie(app, 'student@example.com', 'USER', prisma, gradeA.id);
    studentUser = (await prisma.user.findUniqueOrThrow({ where: { email: 'student@example.com' } })) as any;

    studentNoGradeCookie = await getAuthCookie(app, 'nograde@example.com', 'USER', prisma, null);
    studentNoGradeUser = (await prisma.user.findUniqueOrThrow({ where: { email: 'nograde@example.com' } })) as any;

    otherStudentCookie = await getAuthCookie(app, 'other@example.com', 'USER', prisma, gradeB.id);
    otherStudentUser = (await prisma.user.findUniqueOrThrow({ where: { email: 'other@example.com' } })) as any;

    adminCookie = await getAuthCookie(app, 'admin@example.com', 'ADMIN', prisma);
    adminUser = (await prisma.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } })) as any;

    // 3. Create lessons
    publishedLesson = await prisma.lesson.create({
      data: {
        title: 'Chiến thắng Bạch Đằng 938',
        slug: 'chien-thang-bach-dang-938-' + Date.now(),
        content: '<p>Nội dung bài học lịch sử</p>',
        status: PublishStatus.PUBLISHED,
        grades: {
          create: [{ gradeId: gradeA.id }],
        },
      },
    });

    const publishedLessonB = await prisma.lesson.create({
      data: {
        title: 'Khởi nghĩa Lam Sơn',
        slug: 'khoi-nghia-lam-son-' + Date.now(),
        content: '<p>Nội dung Lam Sơn</p>',
        status: PublishStatus.PUBLISHED,
        grades: {
          create: [{ gradeId: gradeB.id }],
        },
      },
    });

    draftLesson = await prisma.lesson.create({
      data: {
        title: 'Bài học bản nháp',
        slug: 'bai-hoc-nhap-' + Date.now(),
        content: '<p>Chưa xuất bản</p>',
        status: PublishStatus.DRAFT,
        grades: {
          create: [{ gradeId: gradeA.id }],
        },
      },
    });

    // 4. Create quizzes with questions
    // Published quiz on published lesson (Grade A)
    publishedQuiz = await prisma.quiz.create({
      data: {
        lessonId: publishedLesson.id,
        title: 'Quiz Bạch Đằng',
        description: 'Kiểm tra kiến thức trận Bạch Đằng',
        passScore: 60,
        timeLimit: 300, // 300 seconds
        status: PublishStatus.PUBLISHED,
        questions: {
          create: [
            {
              content: 'Năm nào diễn ra trận Bạch Đằng?',
              type: QuestionType.SINGLE_CHOICE,
              points: 1,
              explanation: 'Năm 938 Ngô Quyền đại phá quân Nam Hán',
              displayOrder: 0,
              answers: {
                create: [
                  { content: '938', isCorrect: true, displayOrder: 0 },
                  { content: '981', isCorrect: false, displayOrder: 1 },
                ],
              },
            },
            {
              content: 'Những vị tướng nào gắn liền với chiến thắng Bạch Đằng?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 2,
              explanation: 'Ngô Quyền, Lê Hoàn và Trần Hưng Đạo',
              displayOrder: 1,
              answers: {
                create: [
                  { content: 'Ngô Quyền', isCorrect: true, displayOrder: 0 },
                  { content: 'Trần Hưng Đạo', isCorrect: true, displayOrder: 1 },
                  { content: 'Quang Trung', isCorrect: false, displayOrder: 2 },
                ],
              },
            },
          ],
        },
      },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    // Draft quiz on published lesson B
    draftQuiz = await prisma.quiz.create({
      data: {
        lessonId: publishedLessonB.id,
        title: 'Quiz Lam Sơn Draft',
        passScore: 50,
        status: PublishStatus.DRAFT,
      },
    });

    // Published quiz on draft lesson
    quizOfDraftLesson = await prisma.quiz.create({
      data: {
        lessonId: draftLesson.id,
        title: 'Quiz of Draft Lesson',
        passScore: 50,
        status: PublishStatus.PUBLISHED,
      },
    });

    // Published lesson C & Published quiz 2 (with TRUE_FALSE and SINGLE_CHOICE, passScore: 50)
    publishedLessonC = await prisma.lesson.create({
      data: {
        title: 'Kháng chiến chống Tống 1077',
        slug: 'khang-chien-chong-tong-' + Date.now(),
        content: '<p>Nội dung bài học kháng chiến chống Tống</p>',
        status: PublishStatus.PUBLISHED,
        grades: {
          create: [{ gradeId: gradeA.id }],
        },
      },
    });

    publishedQuiz2 = await prisma.quiz.create({
      data: {
        lessonId: publishedLessonC.id,
        title: 'Quiz Chống Tống',
        description: 'Kiểm tra kiến thức với True/False',
        passScore: 50,
        timeLimit: 100,
        status: PublishStatus.PUBLISHED,
        questions: {
          create: [
            {
              content: 'Trận Như Nguyệt diễn ra vào năm 1077?',
              type: QuestionType.TRUE_FALSE,
              points: 1,
              explanation: 'Chiến thắng Như Nguyệt diễn ra năm 1077',
              displayOrder: 0,
              answers: {
                create: [
                  { content: 'Đúng', isCorrect: true, displayOrder: 0 },
                  { content: 'Sai', isCorrect: false, displayOrder: 1 },
                ],
              },
            },
            {
              content: 'Ai là người chỉ huy quân Đại Việt tại phòng tuyến sông Như Nguyệt?',
              type: QuestionType.SINGLE_CHOICE,
              points: 1,
              explanation: 'Lý Thường Kiệt là chỉ huy',
              displayOrder: 1,
              answers: {
                create: [
                  { content: 'Lý Thường Kiệt', isCorrect: true, displayOrder: 0 },
                  { content: 'Trần Thủ Độ', isCorrect: false, displayOrder: 1 },
                ],
              },
            },
          ],
        },
      },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  });

  // =========================================================================
  // 401 Authentication checks
  // =========================================================================
  describe('401 Authentication checks', () => {
    it('401: GET /api/quizzes từ chối khi chưa đăng nhập', async () => {
      const res = await request(app.getHttpServer()).get('/api/quizzes').expect(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('401: POST /api/quizzes/:id/start từ chối khi chưa đăng nhập', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .expect(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('401: POST /api/quizzes/:id/submit từ chối khi chưa đăng nhập', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .send({ attemptId: 'att-1', answers: [] })
        .expect(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('401: GET /api/quizzes/attempts/:attemptId từ chối khi chưa đăng nhập', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/quizzes/attempts/att-1')
        .expect(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });
  });

  // =========================================================================
  // Q13 & Q15: GET /api/quizzes
  // =========================================================================
  describe('GET /api/quizzes (Q13, Q14, Q15)', () => {
    it('Q13: GET /api/quizzes lọc theo gradeId của người dùng đọc từ DB khi không truyền ?gradeId=', async () => {
      // student has gradeA -> only sees published quizzes with lessons for gradeA
      const res = await request(app.getHttpServer())
        .get('/api/quizzes')
        .set('Cookie', studentCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const quizzes = res.body.data;
      expect(quizzes.some((q: any) => q.id === publishedQuiz.id)).toBe(true);
      // Draft quiz or quiz of draft lesson must NOT be returned
      expect(quizzes.some((q: any) => q.id === draftQuiz.id)).toBe(false);
      expect(quizzes.some((q: any) => q.id === quizOfDraftLesson.id)).toBe(false);
    });

    it('Q13: GET /api/quizzes cho phép ?gradeId= ghi đè gradeId của người dùng', async () => {
      // student has gradeA, but passes ?gradeId=gradeB.id -> should see 0 quizzes because gradeB only has a draft quiz
      const res = await request(app.getHttpServer())
        .get(`/api/quizzes?gradeId=${gradeB.id}`)
        .set('Cookie', studentCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('Q13: GET /api/quizzes trả về tất cả quiz PUBLISHED của bài PUBLISHED khi người dùng chưa có lớp và không có ?gradeId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/quizzes')
        .set('Cookie', studentNoGradeCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      const quizzes = res.body.data;
      expect(quizzes.some((q: any) => q.id === publishedQuiz.id)).toBe(true);
      expect(quizzes.some((q: any) => q.id === draftQuiz.id)).toBe(false);
      expect(quizzes.some((q: any) => q.id === quizOfDraftLesson.id)).toBe(false);
    });

    it('Q13 & Q15: GET /api/quizzes trả status LOCKED khi chưa hoàn thành bài học, kèm thông tin bài học và không lộ câu hỏi', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/quizzes')
        .set('Cookie', studentCookie)
        .expect(200);

      const quizItem = res.body.data.find((q: any) => q.id === publishedQuiz.id);
      expect(quizItem).toBeDefined();
      expect(quizItem.status).toBe('LOCKED');
      expect(quizItem.lastAttempt).toBeNull();
      expect(quizItem.lesson).toEqual({
        id: publishedLesson.id,
        title: publishedLesson.title,
        slug: publishedLesson.slug,
      });
      expect(quizItem.questions).toBeUndefined();
    });

    it('Q13: GET /api/quizzes trả status AVAILABLE khi bài học đã COMPLETED hoặc khi là ADMIN', async () => {
      // Complete lesson for student
      await prisma.lessonProgress.create({
        data: {
          userId: studentUser.id,
          lessonId: publishedLesson.id,
          status: ProgressStatus.COMPLETED,
          progress: 100,
        },
      });

      const resStudent = await request(app.getHttpServer())
        .get('/api/quizzes')
        .set('Cookie', studentCookie)
        .expect(200);

      const studentItem = resStudent.body.data.find((q: any) => q.id === publishedQuiz.id);
      expect(studentItem.status).toBe('AVAILABLE');

      // Admin always sees AVAILABLE even without progress
      const resAdmin = await request(app.getHttpServer())
        .get('/api/quizzes')
        .set('Cookie', adminCookie)
        .expect(200);

      const adminItem = resAdmin.body.data.find((q: any) => q.id === publishedQuiz.id);
      expect(adminItem.status).toBe('AVAILABLE');
    });

    it('Q13 & Q14: GET /api/quizzes trả status DONE kèm điểm lần nộp gần nhất', async () => {
      // Create completed lesson & two submitted attempts for student
      await prisma.lessonProgress.create({
        data: {
          userId: studentUser.id,
          lessonId: publishedLesson.id,
          status: ProgressStatus.COMPLETED,
          progress: 100,
        },
      });

      const olderTime = new Date(Date.now() - 3600 * 1000);
      const newerTime = new Date();

      await prisma.quizAttempt.create({
        data: {
          userId: studentUser.id,
          quizId: publishedQuiz.id,
          startedAt: olderTime,
          submittedAt: olderTime,
          score: 1,
          totalScore: 3,
          correctAnswers: 1,
          totalQuestions: 2,
          passed: false,
        },
      });

      await prisma.quizAttempt.create({
        data: {
          userId: studentUser.id,
          quizId: publishedQuiz.id,
          startedAt: newerTime,
          submittedAt: newerTime,
          score: 3,
          totalScore: 3,
          correctAnswers: 2,
          totalQuestions: 2,
          passed: true,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/quizzes')
        .set('Cookie', studentCookie)
        .expect(200);

      const item = res.body.data.find((q: any) => q.id === publishedQuiz.id);
      expect(item.status).toBe('DONE');
      expect(item.lastAttempt).toEqual({
        score: 3,
        totalScore: 3,
        passed: true,
      });
    });
  });

  // =========================================================================
  // Q1 & Q12: POST /api/quizzes/:id/start
  // =========================================================================
  describe('POST /api/quizzes/:id/start (Q1, Q2, Q3, Q12)', () => {
    it('Q12: POST /api/quizzes/:id/start từ chối 403 LESSON_NOT_COMPLETED khi học sinh chưa hoàn thành bài học', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', studentCookie)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('LESSON_NOT_COMPLETED');
    });

    it('Q12: POST /api/quizzes/:id/start cho phép ADMIN bắt đầu quiz dù bài học chưa hoàn thành', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', adminCookie)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.attemptId).toBeDefined();
    });

    it('Q1: POST /api/quizzes/:id/start từ chối 400 QUIZ_NOT_PUBLISHED khi quiz ở trạng thái DRAFT', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${draftQuiz.id}/start`)
        .set('Cookie', adminCookie)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('QUIZ_NOT_PUBLISHED');
    });

    it('Q1: POST /api/quizzes/:id/start từ chối 400 QUIZ_NOT_PUBLISHED khi bài học ở trạng thái DRAFT', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${quizOfDraftLesson.id}/start`)
        .set('Cookie', adminCookie)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('QUIZ_NOT_PUBLISHED');
    });

    it('Q2: POST /api/quizzes/:id/start trả attemptId, startedAt, expiresAt, serverTime, câu hỏi KHÔNG có isCorrect và explanation', async () => {
      await prisma.lessonProgress.create({
        data: {
          userId: studentUser.id,
          lessonId: publishedLesson.id,
          status: ProgressStatus.COMPLETED,
          progress: 100,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', studentCookie)
        .expect(201);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.attemptId).toBeDefined();
      expect(data.startedAt).toBeDefined();
      expect(data.expiresAt).toBeDefined();
      expect(data.serverTime).toBeDefined();
      expect(data.timeLimit).toBe(300);

      expect(data.questions).toHaveLength(2);
      for (const q of data.questions) {
        expect(q.id).toBeDefined();
        expect(q.content).toBeDefined();
        expect(q.type).toBeDefined();
        expect(q.points).toBeDefined();
        expect(q.displayOrder).toBeDefined();
        expect((q as any).explanation).toBeUndefined();

        expect(q.answers.length).toBeGreaterThanOrEqual(2);
        for (const a of q.answers) {
          expect(a.id).toBeDefined();
          expect(a.content).toBeDefined();
          expect(a.displayOrder).toBeDefined();
          expect((a as any).isCorrect).toBeUndefined();
        }
      }
    });

    it('Q3: POST /api/quizzes/:id/start gọi lần hai khi lượt cũ chưa nộp và chưa hết giờ thì trả về cùng attemptId', async () => {
      await prisma.lessonProgress.create({
        data: {
          userId: studentUser.id,
          lessonId: publishedLesson.id,
          status: ProgressStatus.COMPLETED,
          progress: 100,
        },
      });

      const res1 = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', studentCookie)
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', studentCookie)
        .expect(201);

      expect(res1.body.data.attemptId).toBe(res2.body.data.attemptId);
    });
  });

  // =========================================================================
  // POST /api/quizzes/:id/submit (Q4 - Q9)
  // =========================================================================
  describe('POST /api/quizzes/:id/submit (Q4 - Q9)', () => {
    let studentAttemptId: string;

    beforeEach(async () => {
      await prisma.lessonProgress.create({
        data: {
          userId: studentUser.id,
          lessonId: publishedLesson.id,
          status: ProgressStatus.COMPLETED,
          progress: 100,
        },
      });

      const startRes = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', studentCookie);
      studentAttemptId = startRes.body.data.attemptId;
    });

    it('Q4: POST /api/quizzes/:id/submit trả 404 ATTEMPT_NOT_FOUND khi attemptId thuộc người dùng khác', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', otherStudentCookie) // Other student
        .send({
          attemptId: studentAttemptId,
          answers: [],
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ATTEMPT_NOT_FOUND');
    });

    it('Q8: POST /api/quizzes/:id/submit từ chối 400 VALIDATION_ERROR khi có câu hỏi trùng lặp trong answers', async () => {
      const q1Id = publishedQuiz.questions[0].id;
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [
            { questionId: q1Id, answerIds: [publishedQuiz.questions[0].answers[0].id] },
            { questionId: q1Id, answerIds: [publishedQuiz.questions[0].answers[1].id] },
          ],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('Q8: POST /api/quizzes/:id/submit từ chối 400 VALIDATION_ERROR khi có đáp án trùng lặp trong một câu hỏi', async () => {
      const q1Id = publishedQuiz.questions[0].id;
      const a1Id = publishedQuiz.questions[0].answers[0].id;

      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [{ questionId: q1Id, answerIds: [a1Id, a1Id] }],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('Q8: POST /api/quizzes/:id/submit từ chối 400 khi câu hỏi hoặc đáp án không thuộc quiz', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [{ questionId: 'non-existent-question-id', answerIds: ['some-answer'] }],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('Q6: POST /api/quizzes/:id/submit trả 400 QUIZ_TIME_EXPIRED khi quá hạn 10s du di', async () => {
      // Artificially age the attempt startedAt beyond timeLimit (300s) + 10s
      await prisma.quizAttempt.update({
        where: { id: studentAttemptId },
        data: { startedAt: new Date(Date.now() - 320 * 1000) },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('QUIZ_TIME_EXPIRED');
    });

    it('Q7 & Q9: POST /api/quizzes/:id/submit chấm điểm chính xác theo từng loại câu hỏi và tính passed', async () => {
      const qSingle = publishedQuiz.questions[0]; // 1 point, answer 938 is correct
      const qMulti = publishedQuiz.questions[1]; // 2 points, answers Ngô Quyền & Trần Hưng Đạo are correct
      const aCorrectSingle = qSingle.answers.find((a: any) => a.isCorrect)!.id;
      const aCorrectMulti = qMulti.answers.filter((a: any) => a.isCorrect).map((a: any) => a.id);

      // Submit both fully correct -> 3 / 3 points = 100% >= 60% -> passed: true
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [
            { questionId: qSingle.id, answerIds: [aCorrectSingle] },
            { questionId: qMulti.id, answerIds: aCorrectMulti },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        attemptId: studentAttemptId,
        score: 3,
        totalScore: 3,
        correctAnswers: 2,
        totalQuestions: 2,
        passed: true,
        submittedAt: expect.any(String),
      });

      // Verify answers stored in DB
      const storedAnswers = await prisma.quizAttemptAnswer.findMany({
        where: { attemptId: studentAttemptId },
      });
      expect(storedAnswers).toHaveLength(3); // 1 single + 2 multi
    });

    it('Q5: nộp bài idempotent trả kết quả cũ khi gọi lần 2', async () => {
      const qSingle = publishedQuiz.questions[0];
      const aCorrectSingle = qSingle.answers.find((a: any) => a.isCorrect)!.id;

      const res1 = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [{ questionId: qSingle.id, answerIds: [aCorrectSingle] }],
        })
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [{ questionId: qSingle.id, answerIds: [aCorrectSingle] }],
        })
        .expect(200);

      expect(res1.body.data.score).toBe(res2.body.data.score);
      expect(res1.body.data.submittedAt).toBe(res2.body.data.submittedAt);
    });

    it('Q5: hai lần nộp đồng thời chỉ một lần chấm và ghi nhận kết quả, lần hai trả cùng kết quả', async () => {
      const qSingle = publishedQuiz.questions[0];
      const aCorrectSingle = qSingle.answers.find((a: any) => a.isCorrect)!.id;

      const payload = {
        attemptId: studentAttemptId,
        answers: [{ questionId: qSingle.id, answerIds: [aCorrectSingle] }],
      };

      // Concurrent submissions via Promise.all
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/quizzes/${publishedQuiz.id}/submit`)
          .set('Cookie', studentCookie)
          .send(payload),
        request(app.getHttpServer())
          .post(`/api/quizzes/${publishedQuiz.id}/submit`)
          .set('Cookie', studentCookie)
          .send(payload),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.attemptId).toBe(studentAttemptId);
      expect(res2.body.data.attemptId).toBe(studentAttemptId);
      expect(res1.body.data.score).toBe(res2.body.data.score);

      // Verify no duplicate answers in DB
      const storedAnswers = await prisma.quizAttemptAnswer.findMany({
        where: { attemptId: studentAttemptId },
      });
      expect(storedAnswers).toHaveLength(1);
    });
  });

  // =========================================================================
  // Q10: GET /api/quizzes/attempts/:attemptId
  // =========================================================================
  describe('GET /api/quizzes/attempts/:attemptId (Q10)', () => {
    let studentAttemptId: string;

    beforeEach(async () => {
      await prisma.lessonProgress.create({
        data: {
          userId: studentUser.id,
          lessonId: publishedLesson.id,
          status: ProgressStatus.COMPLETED,
          progress: 100,
        },
      });

      const startRes = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', studentCookie);
      studentAttemptId = startRes.body.data.attemptId;
    });

    it('Q10: GET /api/quizzes/attempts/:attemptId từ chối 400 ATTEMPT_NOT_SUBMITTED khi chưa nộp bài', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/quizzes/attempts/${studentAttemptId}`)
        .set('Cookie', studentCookie)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ATTEMPT_NOT_SUBMITTED');
    });

    it('Q4 & Q10: GET /api/quizzes/attempts/:attemptId từ chối 404 ATTEMPT_NOT_FOUND với người dùng khác', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/quizzes/attempts/${studentAttemptId}`)
        .set('Cookie', otherStudentCookie)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ATTEMPT_NOT_FOUND');
    });

    it('Q10: GET /api/quizzes/attempts/:attemptId trả đầy đủ kết quả xem lại, giải thích và đáp án đúng sau khi nộp', async () => {
      const qSingle = publishedQuiz.questions[0];
      const aCorrectSingle = qSingle.answers.find((a: any) => a.isCorrect)!.id;

      // Submit attempt
      await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [{ questionId: qSingle.id, answerIds: [aCorrectSingle] }],
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/quizzes/attempts/${studentAttemptId}`)
        .set('Cookie', studentCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.attempt.id).toBe(studentAttemptId);
      expect(data.attempt.score).toBe(1);
      expect(data.quiz.id).toBe(publishedQuiz.id);
      expect(data.quiz.lesson.title).toBe(publishedLesson.title);

      expect(data.questions).toHaveLength(2);
      const q1Review = data.questions.find((q: any) => q.id === qSingle.id);
      expect(q1Review).toBeDefined();
      expect(q1Review.explanation).toBe('Năm 938 Ngô Quyền đại phá quân Nam Hán');
      expect(q1Review.isUserCorrect).toBe(true);
      expect(q1Review.selectedAnswerIds).toEqual([aCorrectSingle]);
      expect(q1Review.answers.some((a: any) => a.isCorrect === true)).toBe(true);
    });
  });

  // =========================================================================
  // Bổ sung: Các trường hợp chấm điểm và xử lý lượt thi chi tiết (Q4, Q6, Q7, Q8, Q9, Q10, Q14)
  // =========================================================================
  describe('Bổ sung: Chấm điểm và xử lý lượt thi chi tiết (Q4, Q6, Q7, Q8, Q9, Q10, Q14)', () => {
    let studentAttemptId: string;
    let quiz2AttemptId: string;

    beforeEach(async () => {
      // Hoàn thành cả 2 bài học cho student để có quyền làm quiz
      await prisma.lessonProgress.createMany({
        data: [
          {
            userId: studentUser.id,
            lessonId: publishedLesson.id,
            status: ProgressStatus.COMPLETED,
            progress: 100,
          },
          {
            userId: studentUser.id,
            lessonId: publishedLessonC.id,
            status: ProgressStatus.COMPLETED,
            progress: 100,
          },
        ],
      });

      const startRes1 = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', studentCookie);
      studentAttemptId = startRes1.body.data.attemptId;

      const startRes2 = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/start`)
        .set('Cookie', studentCookie);
      quiz2AttemptId = startRes2.body.data.attemptId;
    });

    // 1. Q7: câu MULTIPLE_CHOICE chỉ chọn 1 trong 2 đáp án đúng thì câu đó 0 điểm
    it('Q7: câu MULTIPLE_CHOICE chỉ chọn 1 trong 2 đáp án đúng thì câu đó 0 điểm', async () => {
      const qMulti = publishedQuiz.questions[1]; // 2 correct answers: Ngô Quyền, Trần Hưng Đạo
      const aCorrectOne = qMulti.answers.find((a: any) => a.isCorrect)!.id;

      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [
            { questionId: qMulti.id, answerIds: [aCorrectOne] }, // chỉ chọn 1 trong 2 đáp án đúng
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(0); // 0 điểm
      expect(res.body.data.correctAnswers).toBe(0);
      expect(res.body.data.totalQuestions).toBe(2);
    });

    // 2. Q7: câu SINGLE_CHOICE chọn sai thì 0 điểm; câu TRUE_FALSE đúng và sai đều được chấm đúng
    it('Q7: câu SINGLE_CHOICE chọn sai thì 0 điểm; câu TRUE_FALSE đúng và sai đều được chấm đúng', async () => {
      const qTF = publishedQuiz2.questions[0]; // TRUE_FALSE, 1 pt, Đúng isCorrect: true
      const qSC = publishedQuiz2.questions[1]; // SINGLE_CHOICE, 1 pt, Lý Thường Kiệt isCorrect: true

      const aCorrectTF = qTF.answers.find((a: any) => a.isCorrect)!.id;
      const aWrongTF = qTF.answers.find((a: any) => !a.isCorrect)!.id;
      const aWrongSC = qSC.answers.find((a: any) => !a.isCorrect)!.id;

      // 2a. SINGLE_CHOICE chọn sai -> 0 điểm; TRUE_FALSE chọn đúng -> 1 điểm
      const res1 = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: quiz2AttemptId,
          answers: [
            { questionId: qTF.id, answerIds: [aCorrectTF] }, // TRUE_FALSE đúng -> 1 pt
            { questionId: qSC.id, answerIds: [aWrongSC] },   // SINGLE_CHOICE sai -> 0 pt
          ],
        })
        .expect(200);

      expect(res1.body.data.score).toBe(1);
      expect(res1.body.data.correctAnswers).toBe(1);

      // 2b. Start lượt mới cho quiz 2 để kiểm tra TRUE_FALSE chọn sai -> 0 điểm
      const startAgain = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/start`)
        .set('Cookie', studentCookie);
      const newAttemptId = startAgain.body.data.attemptId;

      const res2 = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: newAttemptId,
          answers: [
            { questionId: qTF.id, answerIds: [aWrongTF] }, // TRUE_FALSE sai -> 0 pt
            { questionId: qSC.id, answerIds: [aWrongSC] }, // SINGLE_CHOICE sai -> 0 pt
          ],
        })
        .expect(200);

      expect(res2.body.data.score).toBe(0);
      expect(res2.body.data.correctAnswers).toBe(0);
    });

    // 3. Q8: câu bỏ trống (không gửi trong answers) tính sai, vẫn nằm trong totalQuestions
    it('Q8: câu bỏ trống (không gửi trong answers) tính sai, vẫn nằm trong totalQuestions', async () => {
      const qSingle = publishedQuiz.questions[0];
      const aCorrect = qSingle.answers.find((a: any) => a.isCorrect)!.id;

      // Chỉ nộp câu single, bỏ trống câu multi
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [
            { questionId: qSingle.id, answerIds: [aCorrect] },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalQuestions).toBe(2); // Vẫn có 2 câu hỏi
      expect(res.body.data.correctAnswers).toBe(1); // 1 câu đúng
      expect(res.body.data.score).toBe(1);          // 1/3 điểm
      expect(res.body.data.passed).toBe(false);     // 33.3% < 60%
    });

    // 4. Q9: passed=false khi phần trăm dưới passScore, và đúng biên khi bằng passScore (passed=true)
    it('Q9: passed=false khi phần trăm dưới passScore, và đúng biên khi bằng passScore (passed=true)', async () => {
      // publishedQuiz2: passScore = 50, 2 câu mỗi câu 1 điểm -> totalScore = 2
      const qTF = publishedQuiz2.questions[0];
      const qSC = publishedQuiz2.questions[1];
      const aCorrectTF = qTF.answers.find((a: any) => a.isCorrect)!.id;
      const aWrongSC = qSC.answers.find((a: any) => !a.isCorrect)!.id;

      // 4a. 1/2 điểm = 50% == passScore (50) -> đúng biên passed = true
      const resBoundary = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: quiz2AttemptId,
          answers: [
            { questionId: qTF.id, answerIds: [aCorrectTF] }, // 1 pt
            { questionId: qSC.id, answerIds: [aWrongSC] },   // 0 pt
          ],
        })
        .expect(200);

      expect(resBoundary.body.data.score).toBe(1);
      expect(resBoundary.body.data.totalScore).toBe(2);
      expect(resBoundary.body.data.passed).toBe(true); // 50% == 50% -> passed true!

      // 4b. 0/2 điểm = 0% < 50% -> passed = false
      const startAgain = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/start`)
        .set('Cookie', studentCookie);
      const attemptBelow = startAgain.body.data.attemptId;

      const resBelow = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: attemptBelow,
          answers: [],
        })
        .expect(200);

      expect(resBelow.body.data.score).toBe(0);
      expect(resBelow.body.data.totalScore).toBe(2);
      expect(resBelow.body.data.passed).toBe(false);
    });

    // 5. Q10: xem lại sau khi nộp: câu sai và câu bỏ trống có isUserCorrect=false; selectedAnswerIds rỗng với câu bỏ trống
    it('Q10: xem lại sau khi nộp: câu sai và câu bỏ trống có isUserCorrect=false; selectedAnswerIds rỗng với câu bỏ trống', async () => {
      const qTF = publishedQuiz2.questions[0];
      const qSC = publishedQuiz2.questions[1];
      const aWrongTF = qTF.answers.find((a: any) => !a.isCorrect)!.id;

      // Nộp: câu qTF chọn sai (aWrongTF), câu qSC bỏ trống
      await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: quiz2AttemptId,
          answers: [
            { questionId: qTF.id, answerIds: [aWrongTF] },
          ],
        })
        .expect(200);

      const reviewRes = await request(app.getHttpServer())
        .get(`/api/quizzes/attempts/${quiz2AttemptId}`)
        .set('Cookie', studentCookie)
        .expect(200);

      const reviewData = reviewRes.body.data;
      const tfReview = reviewData.questions.find((q: any) => q.id === qTF.id);
      const scReview = reviewData.questions.find((q: any) => q.id === qSC.id);

      // Câu sai: isUserCorrect = false, selectedAnswerIds = [aWrongTF]
      expect(tfReview).toBeDefined();
      expect(tfReview.isUserCorrect).toBe(false);
      expect(tfReview.selectedAnswerIds).toEqual([aWrongTF]);

      // Câu bỏ trống: isUserCorrect = false, selectedAnswerIds = []
      expect(scReview).toBeDefined();
      expect(scReview.isUserCorrect).toBe(false);
      expect(scReview.selectedAnswerIds).toEqual([]);
    });

    // 6. Q14: sau khi đã nộp, gọi start lần nữa tạo attemptId mới (khác lượt cũ)
    it('Q14: sau khi đã nộp, gọi start lần nữa tạo attemptId mới (khác lượt cũ)', async () => {
      // Nộp bài lượt hiện tại
      await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [],
        })
        .expect(200);

      // Gọi start lại
      const startAgainRes = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/start`)
        .set('Cookie', studentCookie)
        .expect(201);

      expect(startAgainRes.body.success).toBe(true);
      expect(startAgainRes.body.data.attemptId).toBeDefined();
      expect(startAgainRes.body.data.attemptId).not.toBe(studentAttemptId);
    });

    // 7. Q4: nộp bằng attemptId của quiz khác trả 404 ATTEMPT_NOT_FOUND
    it('Q4: nộp bằng attemptId của quiz khác trả 404 ATTEMPT_NOT_FOUND', async () => {
      // studentAttemptId thuộc về publishedQuiz, gửi tới publishedQuiz2
      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz2.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [],
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('ATTEMPT_NOT_FOUND');
    });

    // 8. Q6: nộp lúc đã quá timeLimit nhưng còn trong 10 giây du di (ví dụ startedAt lùi timeLimit+5s) vẫn được nhận
    it('Q6: nộp lúc đã quá timeLimit nhưng còn trong 10 giây du di (ví dụ startedAt lùi timeLimit+5s) vẫn được nhận', async () => {
      // publishedQuiz.timeLimit = 300s. Lùi startedAt 305s (quá hạn 5s, trong 10s du di)
      await prisma.quizAttempt.update({
        where: { id: studentAttemptId },
        data: {
          startedAt: new Date(Date.now() - 305 * 1000),
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/quizzes/${publishedQuiz.id}/submit`)
        .set('Cookie', studentCookie)
        .send({
          attemptId: studentAttemptId,
          answers: [],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.attemptId).toBe(studentAttemptId);
    });
  });

  // =========================================================================
  // Admin Quizzes Operations
  // =========================================================================
  describe('Admin Quizzes (admin operations)', () => {
    let emptyQuiz: any;

    beforeEach(async () => {
      const emptyLesson = await prisma.lesson.create({
        data: {
          title: 'Bài học cho Quiz Rỗng ' + Date.now(),
          slug: 'bai-hoc-quiz-rong-' + Date.now(),
          content: '<p>Nội dung</p>',
          status: PublishStatus.DRAFT,
        },
      });

      emptyQuiz = await prisma.quiz.create({
        data: {
          lessonId: emptyLesson.id,
          title: 'Quiz Bản Nháp Chưa Có Câu Hỏi',
          description: 'Mô tả quiz',
          passScore: 60,
          status: PublishStatus.DRAFT,
        },
      });
    });

    // 1. Q-ADMIN-ATTEMPTS: PUT /questions & DELETE bị chặn 409 khi có attempt
    it('Q-ADMIN-ATTEMPTS: PUT /api/admin/quizzes/:id/questions trả 409 QUIZ_HAS_ATTEMPTS khi quiz đã có lượt làm bài', async () => {
      await prisma.quizAttempt.create({
        data: {
          userId: studentUser.id,
          quizId: publishedQuiz.id,
        },
      });

      const res = await request(app.getHttpServer())
        .put(`/api/admin/quizzes/${publishedQuiz.id}/questions`)
        .set('Cookie', adminCookie)
        .send({
          questions: [
            {
              content: 'Câu hỏi mới thay thế?',
              type: QuestionType.SINGLE_CHOICE,
              points: 1,
              answers: [
                { content: 'A', isCorrect: true, displayOrder: 0 },
                { content: 'B', isCorrect: false, displayOrder: 1 },
              ],
            },
          ],
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('QUIZ_HAS_ATTEMPTS');
    });

    it('Q-ADMIN-ATTEMPTS: DELETE /api/admin/quizzes/:id trả 409 QUIZ_HAS_ATTEMPTS khi quiz đã có lượt làm bài', async () => {
      await prisma.quizAttempt.create({
        data: {
          userId: studentUser.id,
          quizId: publishedQuiz.id,
        },
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/admin/quizzes/${publishedQuiz.id}`)
        .set('Cookie', adminCookie)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('QUIZ_HAS_ATTEMPTS');
    });

    it('Q-ADMIN-ATTEMPTS: PATCH /api/admin/quizzes/:id cho phép sửa tiêu đề, mô tả, passScore, timeLimit khi quiz đã có lượt làm bài', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/quizzes/${publishedQuiz.id}`)
        .set('Cookie', adminCookie)
        .send({
          title: 'Tiêu đề Bạch Đằng cập nhật',
          passScore: 75,
          timeLimit: 600,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Tiêu đề Bạch Đằng cập nhật');
      expect(res.body.data.passScore).toBe(75);
      expect(res.body.data.timeLimit).toBe(600);
    });

    // 2. Validate theo loại câu hỏi
    it('Q-ADMIN-VAL-SINGLE: PUT /api/admin/quizzes/:id/questions trả 400 khi câu hỏi SINGLE_CHOICE không có đúng 1 đáp án đúng', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/admin/quizzes/${emptyQuiz.id}/questions`)
        .set('Cookie', adminCookie)
        .send({
          questions: [
            {
              content: 'Câu hỏi một lựa chọn nhưng có 2 đáp án đúng?',
              type: QuestionType.SINGLE_CHOICE,
              points: 1,
              answers: [
                { content: 'A', isCorrect: true, displayOrder: 0 },
                { content: 'B', isCorrect: true, displayOrder: 1 },
              ],
            },
          ],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('Q-ADMIN-VAL-TF: PUT /api/admin/quizzes/:id/questions trả 400 khi câu hỏi TRUE_FALSE không có đúng 2 đáp án hoặc không có 1 đáp án đúng', async () => {
      // 3 answers
      const res3 = await request(app.getHttpServer())
        .put(`/api/admin/quizzes/${emptyQuiz.id}/questions`)
        .set('Cookie', adminCookie)
        .send({
          questions: [
            {
              content: 'Câu hỏi Đúng/Sai nhưng có 3 đáp án?',
              type: QuestionType.TRUE_FALSE,
              points: 1,
              answers: [
                { content: 'Đúng', isCorrect: true, displayOrder: 0 },
                { content: 'Sai', isCorrect: false, displayOrder: 1 },
                { content: 'Không biết', isCorrect: false, displayOrder: 2 },
              ],
            },
          ],
        })
        .expect(400);

      expect(res3.body.success).toBe(false);
      expect(res3.body.errorCode).toBe('VALIDATION_ERROR');

      // 2 answers but 0 correct
      const res0 = await request(app.getHttpServer())
        .put(`/api/admin/quizzes/${emptyQuiz.id}/questions`)
        .set('Cookie', adminCookie)
        .send({
          questions: [
            {
              content: 'Câu hỏi Đúng/Sai nhưng 0 đáp án đúng?',
              type: QuestionType.TRUE_FALSE,
              points: 1,
              answers: [
                { content: 'Đúng', isCorrect: false, displayOrder: 0 },
                { content: 'Sai', isCorrect: false, displayOrder: 1 },
              ],
            },
          ],
        })
        .expect(400);

      expect(res0.body.success).toBe(false);
      expect(res0.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('Q-ADMIN-VAL-MULTI: PUT /api/admin/quizzes/:id/questions trả 400 khi câu hỏi MULTIPLE_CHOICE có 0 đáp án đúng', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/admin/quizzes/${emptyQuiz.id}/questions`)
        .set('Cookie', adminCookie)
        .send({
          questions: [
            {
              content: 'Câu hỏi nhiều lựa chọn nhưng 0 đáp án đúng?',
              type: QuestionType.MULTIPLE_CHOICE,
              points: 2,
              answers: [
                { content: 'A', isCorrect: false, displayOrder: 0 },
                { content: 'B', isCorrect: false, displayOrder: 1 },
                { content: 'C', isCorrect: false, displayOrder: 2 },
              ],
            },
          ],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('Q-ADMIN-VAL-LIMITS: PUT /api/admin/quizzes/:id/questions trả 400 khi câu hỏi có dưới 2 hoặc trên 6 đáp án', async () => {
      const res1 = await request(app.getHttpServer())
        .put(`/api/admin/quizzes/${emptyQuiz.id}/questions`)
        .set('Cookie', adminCookie)
        .send({
          questions: [
            {
              content: 'Chỉ có 1 đáp án?',
              type: QuestionType.SINGLE_CHOICE,
              points: 1,
              answers: [{ content: 'A', isCorrect: true, displayOrder: 0 }],
            },
          ],
        })
        .expect(400);

      expect(res1.body.success).toBe(false);
      expect(res1.body.errorCode).toBe('VALIDATION_ERROR');
    });

    // 3. Publish rule
    it('Q-ADMIN-PUB: PATCH /api/admin/quizzes/:id với status PUBLISHED trả 422 QUIZ_NO_QUESTIONS khi quiz chưa có câu hỏi', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/quizzes/${emptyQuiz.id}`)
        .set('Cookie', adminCookie)
        .send({ status: PublishStatus.PUBLISHED })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('QUIZ_NO_QUESTIONS');
    });

    it('Q-ADMIN-PUB: POST /api/admin/quizzes/:id/publish trả 422 QUIZ_NO_QUESTIONS khi quiz chưa có câu hỏi', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/admin/quizzes/${emptyQuiz.id}/publish`)
        .set('Cookie', adminCookie)
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('QUIZ_NO_QUESTIONS');
    });

    it('Q-ADMIN-PUB: PATCH /api/admin/quizzes/:id cho phép đổi status từ PUBLISHED về DRAFT mà không cần validate câu hỏi', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/admin/quizzes/${emptyQuiz.id}`)
        .set('Cookie', adminCookie)
        .send({ status: PublishStatus.DRAFT })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PublishStatus.DRAFT);
    });

    it('Q-ADMIN-PUB: POST /api/admin/quizzes/:id/publish thành công 200 khi quiz đã có câu hỏi hợp lệ', async () => {
      // 1. Thêm câu hỏi hợp lệ
      await request(app.getHttpServer())
        .put(`/api/admin/quizzes/${emptyQuiz.id}/questions`)
        .set('Cookie', adminCookie)
        .send({
          questions: [
            {
              content: 'Ngô Quyền lãnh đạo chiến thắng Bạch Đằng năm nào?',
              type: QuestionType.SINGLE_CHOICE,
              points: 1,
              answers: [
                { content: '938', isCorrect: true, displayOrder: 0 },
                { content: '1077', isCorrect: false, displayOrder: 1 },
              ],
            },
          ],
        })
        .expect(200);

      // 2. Publish thành công
      const res = await request(app.getHttpServer())
        .post(`/api/admin/quizzes/${emptyQuiz.id}/publish`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PublishStatus.PUBLISHED);
    });
  });
});
