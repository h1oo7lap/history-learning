import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ProgressStatus, PublishStatus } from '@history-learning/shared';

async function getAuthCookie(app: INestApplication, email: string): Promise<string> {
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1!', fullName: 'Test User' });

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: 'Password1!' });

  const setCookieHeader = res.headers['set-cookie'];
  return Array.isArray(setCookieHeader) ? setCookieHeader[0] ?? '' : String(setCookieHeader ?? '');
}

async function clearProgressData(prisma: PrismaService) {
  // Always clean child tables first due to Restrict FKs
  await prisma.$executeRaw`TRUNCATE TABLE lesson_progress CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE lessons CASCADE`;
  await clearAuthTables(prisma);
}

describe('Progress (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userCookie: string;
  let adminCookie: string;
  let userBcookie: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await clearProgressData(prisma);
    await app.close();
  });

  beforeEach(async () => {
    await clearProgressData(prisma);

    // Register User A
    userCookie = await getAuthCookie(app, 'user-a@example.com');
    const userA = await prisma.user.findUniqueOrThrow({
      where: { email: 'user-a@example.com' },
    });
    userAId = userA.id;

    // Register User B
    userBcookie = await getAuthCookie(app, 'user-b@example.com');
    const userB = await prisma.user.findUniqueOrThrow({
      where: { email: 'user-b@example.com' },
    });
    userBId = userB.id;

    // Register Admin
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'admin@example.com', password: 'Password1!', fullName: 'Admin User' });
    await prisma.user.updateMany({
      where: { email: 'admin@example.com' },
      data: { role: 'ADMIN' },
    });
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Password1!' });
    const adminSetCookie = adminRes.headers['set-cookie'];
    adminCookie = Array.isArray(adminSetCookie) ? adminSetCookie[0] ?? '' : String(adminSetCookie ?? '');
  });

  // =========================================================================
  // 401 UNAUTHORIZED
  // =========================================================================
  describe('401 Authentication checks', () => {
    it('401: POST /api/lessons/:id/start từ chối khi chưa đăng nhập', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/lessons/lesson-1/start')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('401: POST /api/lessons/:id/complete từ chối khi chưa đăng nhập', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/lessons/lesson-1/complete')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('401: GET /api/progress/me từ chối khi chưa đăng nhập', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/progress/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });
  });

  // =========================================================================
  // 400 VALIDATION_ERROR
  // =========================================================================
  describe('400 Validation checks', () => {
    it('400: POST /api/lessons/:id/start trả 400 VALIDATION_ERROR khi id sai định dạng', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/lessons/%20/start')
        .set('Cookie', userCookie)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('400: POST /api/lessons/:id/complete trả 400 VALIDATION_ERROR khi id sai định dạng', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/lessons/%20/complete')
        .set('Cookie', userCookie)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // 404 LESSON_NOT_FOUND
  // =========================================================================
  describe('404 Lesson Not Found checks', () => {
    it('404: POST /api/lessons/:id/start trả 404 LESSON_NOT_FOUND khi lessonId không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/lessons/non-existent-lesson-id/start')
        .set('Cookie', userCookie)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('LESSON_NOT_FOUND');
    });

    it('404: POST /api/lessons/:id/complete trả 404 LESSON_NOT_FOUND khi lessonId không tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/lessons/non-existent-lesson-id/complete')
        .set('Cookie', userCookie)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('LESSON_NOT_FOUND');
    });

    it('404: POST /api/lessons/:id/start trả 404 LESSON_NOT_FOUND với bài học DRAFT hoặc ARCHIVED', async () => {
      const draftLesson = await prisma.lesson.create({
        data: {
          title: 'Bài DRAFT',
          slug: 'bai-draft',
          content: '<p>Nội dung draft</p>',
          status: PublishStatus.DRAFT,
        },
      });

      const archivedLesson = await prisma.lesson.create({
        data: {
          title: 'Bài ARCHIVED',
          slug: 'bai-archived',
          content: '<p>Nội dung archived</p>',
          status: PublishStatus.ARCHIVED,
        },
      });

      const resDraft = await request(app.getHttpServer())
        .post(`/api/lessons/${draftLesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(404);
      expect(resDraft.body.errorCode).toBe('LESSON_NOT_FOUND');

      const resArchived = await request(app.getHttpServer())
        .post(`/api/lessons/${archivedLesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(404);
      expect(resArchived.body.errorCode).toBe('LESSON_NOT_FOUND');
    });

    it('404: POST /api/lessons/:id/complete trả 404 LESSON_NOT_FOUND với bài học DRAFT hoặc ARCHIVED', async () => {
      const draftLesson = await prisma.lesson.create({
        data: {
          title: 'Bài DRAFT 2',
          slug: 'bai-draft-2',
          content: '<p>Nội dung draft</p>',
          status: PublishStatus.DRAFT,
        },
      });

      const resDraft = await request(app.getHttpServer())
        .post(`/api/lessons/${draftLesson.id}/complete`)
        .set('Cookie', userCookie)
        .expect(404);
      expect(resDraft.body.errorCode).toBe('LESSON_NOT_FOUND');
    });
  });

  // =========================================================================
  // P3: POST /api/lessons/:id/start
  // =========================================================================
  describe('P3: start lesson', () => {
    it('P3: POST /api/lessons/:id/start tạo mới tiến độ IN_PROGRESS với progress=0 và startedAt', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài PUBLISHED 1',
          slug: 'bai-published-1',
          content: '<p>Nội dung 1</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.lessonId).toBe(lesson.id);
      expect(res.body.data.userId).toBe(userAId);
      expect(res.body.data.status).toBe(ProgressStatus.IN_PROGRESS);
      expect(res.body.data.progress).toBe(0);
      expect(res.body.data.startedAt).toBeTruthy();
      expect(res.body.data.completedAt).toBeNull();
    });

    it('P3: POST /api/lessons/:id/start lặp lại khi đang IN_PROGRESS giữ nguyên tiến độ', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài PUBLISHED 2',
          slug: 'bai-published-2',
          content: '<p>Nội dung 2</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      const res1 = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(201);

      expect(res2.body.data.status).toBe(ProgressStatus.IN_PROGRESS);
      expect(res2.body.data.startedAt).toBe(res1.body.data.startedAt);
    });

    it('P3: start không bao giờ hạ trạng thái COMPLETED xuống IN_PROGRESS', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài PUBLISHED 3',
          slug: 'bai-published-3',
          content: '<p>Nội dung 3</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      // Complete first
      await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/complete`)
        .set('Cookie', userCookie)
        .expect(201);

      // Now call start
      const res = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(201);

      expect(res.body.data.status).toBe(ProgressStatus.COMPLETED);
      expect(res.body.data.progress).toBe(100);
      expect(res.body.data.completedAt).toBeTruthy();
    });
  });

  // =========================================================================
  // P3: POST /api/lessons/:id/complete
  // =========================================================================
  describe('P3: complete lesson', () => {
    it('P3: POST /api/lessons/:id/complete chuyển sang COMPLETED với progress=100 và ghi nhận completedAt', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài PUBLISHED 4',
          slug: 'bai-published-4',
          content: '<p>Nội dung 4</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      // Start first
      await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(201);

      // Complete
      const res = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/complete`)
        .set('Cookie', userCookie)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ProgressStatus.COMPLETED);
      expect(res.body.data.progress).toBe(100);
      expect(res.body.data.startedAt).toBeTruthy();
      expect(res.body.data.completedAt).toBeTruthy();
    });

    it('P3: POST /api/lessons/:id/complete có thể hoàn thành trực tiếp mà không cần gọi start trước', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài PUBLISHED 5',
          slug: 'bai-published-5',
          content: '<p>Nội dung 5</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/complete`)
        .set('Cookie', userCookie)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ProgressStatus.COMPLETED);
      expect(res.body.data.progress).toBe(100);
      expect(res.body.data.startedAt).toBeTruthy();
      expect(res.body.data.completedAt).toBeTruthy();
    });

    it('P3: complete nếu bản ghi đã có nhưng startedAt đang null thì đặt startedAt = now', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài PUBLISHED 6',
          slug: 'bai-published-6',
          content: '<p>Nội dung 6</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      // Seed a record with startedAt: null
      await prisma.lessonProgress.create({
        data: {
          userId: userAId,
          lessonId: lesson.id,
          status: ProgressStatus.NOT_STARTED,
          progress: 0,
          startedAt: null,
          completedAt: null,
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/complete`)
        .set('Cookie', userCookie)
        .expect(201);

      expect(res.body.data.status).toBe(ProgressStatus.COMPLETED);
      expect(res.body.data.progress).toBe(100);
      expect(res.body.data.startedAt).toBeTruthy();
      expect(res.body.data.completedAt).toBeTruthy();
    });

    it('P1: complete lặp lại trả cùng kết quả và giữ nguyên completedAt lần đầu', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài PUBLISHED 7',
          slug: 'bai-published-7',
          content: '<p>Nội dung 7</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      const res1 = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/complete`)
        .set('Cookie', userCookie)
        .expect(201);

      const firstCompletedAt = res1.body.data.completedAt;

      const res2 = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/complete`)
        .set('Cookie', userCookie)
        .expect(201);

      expect(res2.body.data.completedAt).toBe(firstCompletedAt);
      expect(res2.body.data.status).toBe(ProgressStatus.COMPLETED);
      expect(res2.body.data.progress).toBe(100);
    });
  });

  // =========================================================================
  // P1: Concurrency / Race Condition
  // =========================================================================
  describe('P1: Concurrency and Race Condition safety', () => {
    it('P1: hai request start đồng thời không gây lỗi unique 500', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài Race Start',
          slug: 'bai-race-start',
          content: '<p>Nội dung race</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/lessons/${lesson.id}/start`)
          .set('Cookie', userCookie),
        request(app.getHttpServer())
          .post(`/api/lessons/${lesson.id}/start`)
          .set('Cookie', userCookie),
      ]);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.status).toBe(ProgressStatus.IN_PROGRESS);
      expect(res2.body.data.status).toBe(ProgressStatus.IN_PROGRESS);

      const count = await prisma.lessonProgress.count({
        where: { userId: userAId, lessonId: lesson.id },
      });
      expect(count).toBe(1);
    });

    it('P1: hai request complete đồng thời không gây lỗi unique 500 và completedAt chỉ ghi 1 lần', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài Race Complete',
          slug: 'bai-race-complete',
          content: '<p>Nội dung race</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/lessons/${lesson.id}/complete`)
          .set('Cookie', userCookie),
        request(app.getHttpServer())
          .post(`/api/lessons/${lesson.id}/complete`)
          .set('Cookie', userCookie),
      ]);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.status).toBe(ProgressStatus.COMPLETED);
      expect(res2.body.data.status).toBe(ProgressStatus.COMPLETED);
      expect(res1.body.data.completedAt).toBe(res2.body.data.completedAt);

      const count = await prisma.lessonProgress.count({
        where: { userId: userAId, lessonId: lesson.id },
      });
      expect(count).toBe(1);
    });
  });

  // =========================================================================
  // P3: GET /api/progress/me & Isolation
  // =========================================================================
  describe('P3: get my progress and isolation', () => {
    it('P3: GET /api/progress/me trả danh sách tiến độ gồm lessonId, status, progress, startedAt, completedAt', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài Tiến Độ Me',
          slug: 'bai-tien-do-me',
          content: '<p>Nội dung</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/progress/me')
        .set('Cookie', userCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);

      const item = res.body.data[0];
      expect(item).toMatchObject({
        lessonId: lesson.id,
        status: ProgressStatus.IN_PROGRESS,
        progress: 0,
      });
      expect(item.startedAt).toBeTruthy();
      expect(item.completedAt).toBeNull();
    });

    it('P3: người dùng A không thấy bản ghi tiến độ của người dùng B trên GET /api/progress/me', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài Cách Ly',
          slug: 'bai-cach-ly',
          content: '<p>Nội dung</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      // User A starts the lesson
      await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/start`)
        .set('Cookie', userCookie)
        .expect(201);

      // User B has not started any lesson
      const resB = await request(app.getHttpServer())
        .get('/api/progress/me')
        .set('Cookie', userBcookie)
        .expect(200);

      expect(resB.body.success).toBe(true);
      expect(resB.body.data).toEqual([]);

      // User A sees their own progress
      const resA = await request(app.getHttpServer())
        .get('/api/progress/me')
        .set('Cookie', userCookie)
        .expect(200);

      expect(resA.body.data.length).toBe(1);
      expect(resA.body.data[0].lessonId).toBe(lesson.id);
    });
  });

  // =========================================================================
  // Roles check
  // =========================================================================
  describe('P3: Role accessibility', () => {
    it('P3: cả vai trò USER và ADMIN đã đăng nhập đều dùng được các API tiến độ', async () => {
      const lesson = await prisma.lesson.create({
        data: {
          title: 'Bài Vai Trò',
          slug: 'bai-vai-tro',
          content: '<p>Nội dung</p>',
          status: PublishStatus.PUBLISHED,
        },
      });

      // Admin can start
      const adminStart = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/start`)
        .set('Cookie', adminCookie)
        .expect(201);
      expect(adminStart.body.success).toBe(true);
      expect(adminStart.body.data.status).toBe(ProgressStatus.IN_PROGRESS);

      // Admin can complete
      const adminComplete = await request(app.getHttpServer())
        .post(`/api/lessons/${lesson.id}/complete`)
        .set('Cookie', adminCookie)
        .expect(201);
      expect(adminComplete.body.success).toBe(true);
      expect(adminComplete.body.data.status).toBe(ProgressStatus.COMPLETED);

      // Admin can get progress
      const adminGet = await request(app.getHttpServer())
        .get('/api/progress/me')
        .set('Cookie', adminCookie)
        .expect(200);
      expect(adminGet.body.success).toBe(true);
      expect(adminGet.body.data.length).toBe(1);
    });
  });
});
