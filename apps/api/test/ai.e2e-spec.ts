import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { AI_PROVIDER } from '../src/ai/ai.provider';
import { FakeAiProvider } from '../src/ai/fake-ai.provider';
import { EMBEDDING_PROVIDER } from '../src/ai/embedding.provider';
import { FakeEmbeddingProvider } from '../src/ai/fake-embedding.provider';
import { LessonIndexingService } from '../src/ai/lesson-indexing.service';
import { clearAuthTables, clearAiTables } from './setup';
import { ErrorCodes } from '../src/common/errors/error-codes';
import { AI } from '@history-learning/shared';

describe('AI Chat (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fakeAi: FakeAiProvider;
  let indexingService: LessonIndexingService;

  let userCookie: string;
  let userACookie: string;
  let userBCookie: string;
  let studentLopACookie: string;
  let adminCookie: string;
  let publishedLessonId: string;
  let draftLessonId: string;
  let gradeBLessonId: string;

  async function getCookieForUser(
    email: string,
    fullName: string,
    role: 'USER' | 'ADMIN' = 'USER',
    gradeId?: string | null,
  ): Promise<string> {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Password1!', fullName });

    if (role !== 'USER' || gradeId) {
      await prisma.user.update({
        where: { email },
        data: { role, gradeId },
      });
    }

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'Password1!' });

    const setCookie = loginRes.headers['set-cookie'];
    return Array.isArray(setCookie) ? setCookie[0] ?? '' : String(setCookie ?? '');
  }

  beforeAll(async () => {
    // Confirm connecting to test database
    if (!process.env['TEST_DATABASE_URL']) {
      throw new Error('TEST_DATABASE_URL is not set');
    }
    process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL'];

    fakeAi = new FakeAiProvider();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AI_PROVIDER)
      .useValue(fakeAi)
      .overrideProvider(EMBEDDING_PROVIDER)
      .useClass(FakeEmbeddingProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

    await app.init();

    prisma = app.get(PrismaService);
    indexingService = app.get(LessonIndexingService);
    indexingService.isAutoIndexDisabled = true;

    await clearAuthTables(prisma);
    await clearAiTables(prisma);

    // Ensure grades exist: Grade A and Grade B
    let edu = await prisma.educationLevel.findFirst();
    if (!edu) {
      edu = await prisma.educationLevel.create({
        data: { name: 'Tiểu học', code: 'PRIMARY_TEST', displayOrder: 1 },
      });
    }

    const gradeA = await prisma.grade.upsert({
      where: { code: 'GRADE_4_AI_E2E' },
      update: {},
      create: {
        name: 'Lớp 4 Test',
        code: 'GRADE_4_AI_E2E',
        educationLevelId: edu.id,
        displayOrder: 1,
      },
    });

    const gradeB = await prisma.grade.upsert({
      where: { code: 'GRADE_5_AI_E2E' },
      update: {},
      create: {
        name: 'Lớp 5 Test',
        code: 'GRADE_5_AI_E2E',
        educationLevelId: edu.id,
        displayOrder: 2,
      },
    });

    // Register test users
    userCookie = await getCookieForUser('user-ai-general@example.com', 'General Student');
    userACookie = await getCookieForUser('user-ai-rate-a@example.com', 'Student A');
    userBCookie = await getCookieForUser('user-ai-rate-b@example.com', 'Student B');
    studentLopACookie = await getCookieForUser(
      'user-ai-student-grade-a@example.com',
      'Student Grade A',
      'USER',
      gradeA.id,
    );
    adminCookie = await getCookieForUser(
      'admin-ai-system@example.com',
      'Admin Teacher',
      'ADMIN',
      gradeA.id,
    );

    // Create published test lesson in Grade A (Bạch Đằng)
    const pub = await prisma.lesson.upsert({
      where: { slug: 'chien-thang-bach-dang-e2e-test' },
      update: { status: 'PUBLISHED', gradeId: gradeA.id, isFeatured: true },
      create: {
        title: 'Chiến thắng Bạch Đằng năm 938 – Ngô Quyền',
        slug: 'chien-thang-bach-dang-e2e-test',
        status: 'PUBLISHED',
        gradeId: gradeA.id,
        isFeatured: true,
        content:
          'Năm 938, chúa Nam Hán sai Hoằng Tháo sang xâm lược nước ta. Ngô Quyền bố trí trận địa cọc ngầm cắm cọc gỗ vót nhọn bịt sắt tại cửa sông Bạch Đằng hiểm yếu, đánh tan quân giặc khi thủy triều rút.',
        difficulty: 'EASY',
        estimatedTime: 10,
        displayOrder: 100,
      },
    });
    publishedLessonId = pub.id;

    // Create published test lesson in Grade B (Điện Biên Phủ)
    const pubB = await prisma.lesson.upsert({
      where: { slug: 'dien-bien-phu-e2e-grade-b' },
      update: { status: 'PUBLISHED', gradeId: gradeB.id },
      create: {
        title: 'Chiến dịch Điện Biên Phủ 1954',
        slug: 'dien-bien-phu-e2e-grade-b',
        status: 'PUBLISHED',
        gradeId: gradeB.id,
        content:
          'Năm 1954, quân dân ta dưới sự lãnh đạo của Đại tướng Võ Nguyên Giáp mở chiến dịch Điện Biên Phủ lừng lẫy năm châu, chấn động địa cầu, bắt sống tướng Đờ Cát.',
        difficulty: 'EASY',
        estimatedTime: 10,
        displayOrder: 102,
      },
    });
    gradeBLessonId = pubB.id;

    // Create draft test lesson
    const draft = await prisma.lesson.upsert({
      where: { slug: 'khang-chien-mong-co-e2e-draft' },
      update: { status: 'DRAFT', gradeId: gradeA.id },
      create: {
        title: 'Kháng chiến chống quân Mông Cổ bản thảo',
        slug: 'khang-chien-mong-co-e2e-draft',
        status: 'DRAFT',
        gradeId: gradeA.id,
        content: 'Bản thảo chưa xuất bản về ba lần kháng chiến...',
        difficulty: 'EASY',
        estimatedTime: 10,
        displayOrder: 101,
      },
    });
    draftLessonId = draft.id;

    // Manually index the test lessons
    await indexingService.reindexLesson(publishedLessonId);
    await indexingService.reindexLesson(gradeBLessonId);
    await indexingService.reindexLesson(draftLessonId);
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. 401 khi chưa đăng nhập
  it('returns 401 UNAUTHORIZED when request has no authentication cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .send({ question: 'Chiến thắng Bạch Đằng diễn ra năm nào?' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 2. 400 validation: question rỗng
  it('returns 400 VALIDATION_ERROR when question is empty', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set('Cookie', userCookie)
      .send({ question: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe(ErrorCodes.VALIDATION_ERROR);
  });

  // 3. 400 validation: history > 4 tin
  it('returns 400 VALIDATION_ERROR when history contains more than 4 messages', async () => {
    const history = [
      { role: 'user', content: 'Câu hỏi 1' },
      { role: 'model', content: 'Trả lời 1' },
      { role: 'user', content: 'Câu hỏi 2' },
      { role: 'model', content: 'Trả lời 2' },
      { role: 'user', content: 'Câu hỏi 3' },
    ];

    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set('Cookie', userCookie)
      .send({
        question: 'Ngô Quyền dùng kế sách gì?',
        history,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe(ErrorCodes.VALIDATION_ERROR);
  });

  // 4. tin model > 2000 ký tự được cắt tự động, không bị 400
  it('truncates model history messages longer than 2000 chars without returning 400', async () => {
    fakeAi.setMockAnswer('Ngô Quyền cắm cọc ngầm trên sông Bạch Đằng.');

    const longModelMessage = 'Chi tiết '.repeat(300); // > 2000 chars
    const history = [
      { role: 'user', content: 'Ngô Quyền là ai?' },
      { role: 'model', content: longModelMessage },
    ];

    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set('Cookie', userCookie)
      .send({
        question: 'Ngô Quyền đánh giặc trên sông Bạch Đằng như thế nào?',
        history,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBeDefined();
  });

  // 5. 200 có sources khi tìm được bài phù hợp
  it('returns 200 with answer and sources for in-scope question', async () => {
    fakeAi.setMockAnswer('Ngô Quyền dùng kế cọc ngầm đánh bại quân Nam Hán.');

    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set('Cookie', userCookie)
      .send({ question: 'Kế sách cọc ngầm trên sông Bạch Đằng do ai thực hiện?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBe('Ngô Quyền dùng kế cọc ngầm đánh bại quân Nam Hán.');
    expect(res.body.data.sources.length).toBeGreaterThan(0);
    expect(res.body.data.sources[0]?.slug).toBe('chien-thang-bach-dang-e2e-test');
  });

  // 6. 200 từ chối ngoài phạm vi (sources: [])
  it('returns 200 with refusal message and empty sources for out-of-scope question without calling chat model', async () => {
    fakeAi.reset();

    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set('Cookie', userCookie)
      .send({ question: 'Công thức tính diện tích hình thang trong toán học là gì?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBe(AI.NO_CONTEXT_REFUSAL_MESSAGE);
    expect(res.body.data.sources).toEqual([]);
    expect(fakeAi.lastChatParams).toBeNull();
  });

  // 7. lessonId hợp lệ chỉ ra nguồn bài đó
  it('restricts search to specified lessonId when valid published lessonId is provided', async () => {
    fakeAi.setMockAnswer('Ngô Quyền dùng cọc ngầm bịt sắt.');

    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set('Cookie', userCookie)
      .send({
        question: 'Trận đánh Bạch Đằng dùng kế gì?',
        lessonId: publishedLessonId,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sources).toHaveLength(1);
    expect(res.body.data.sources[0]?.lessonId).toBe(publishedLessonId);
  });

  // 8. lessonId sai → 404
  it('returns 404 LESSON_NOT_FOUND when lessonId does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set('Cookie', userCookie)
      .send({
        question: 'Ngô Quyền đánh giặc năm nào?',
        lessonId: 'cm00000000000000000000000',
      });

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe(ErrorCodes.LESSON_NOT_FOUND);
  });

  it('returns 404 LESSON_NOT_PUBLISHED when lessonId belongs to an unpublished/draft lesson', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set('Cookie', userCookie)
      .send({
        question: 'Kháng chiến chống quân Mông Cổ',
        lessonId: draftLessonId,
      });

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe(ErrorCodes.LESSON_NOT_PUBLISHED);
  });

  // 9. 429 sau 10 câu cùng user & 10. User B cùng IP vẫn gọi được bình thường
  describe('Rate Limiting (10 requests/minute per userId)', () => {
    it('returns 429 AI_RATE_LIMITED after 10 requests for User A, while User B remains unblocked', async () => {
      fakeAi.setMockAnswer('Câu trả lời mẫu.');

      // User A makes 10 requests successfully
      for (let i = 0; i < 10; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/ai/chat')
          .set('Cookie', userACookie)
          .send({ question: `Câu hỏi số ${i + 1} về trận Bạch Đằng năm 938` });

        expect(res.status).toBe(200);
      }

      // 11th request for User A must hit 429
      const resA11 = await request(app.getHttpServer())
        .post('/api/ai/chat')
        .set('Cookie', userACookie)
        .send({ question: 'Câu hỏi số 11 về trận Bạch Đằng năm 938' });

      expect(resA11.status).toBe(429);
      expect(resA11.body.errorCode).toBe(ErrorCodes.AI_RATE_LIMITED);

      // User B sharing the same IP / client must NOT be blocked
      const resB = await request(app.getHttpServer())
        .post('/api/ai/chat')
        .set('Cookie', userBCookie)
        .send({ question: 'Câu hỏi của học sinh B về Bạch Đằng năm 938' });

      expect(resB.status).toBe(200);
      expect(resB.body.success).toBe(true);
    });
  });

  // 11. Giới hạn theo lớp: học sinh lớp A vs admin hỏi nội dung lớp B
  describe('Grade scoping by role', () => {
    it('(a) student in Grade A asking content exclusive to Grade B is refused with empty sources', async () => {
      fakeAi.reset();

      const res = await request(app.getHttpServer())
        .post('/api/ai/chat')
        .set('Cookie', studentLopACookie)
        .send({ question: 'Chiến dịch Điện Biên Phủ 1954 bắt sống tướng nào?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBe(AI.NO_CONTEXT_REFUSAL_MESSAGE);
      expect(res.body.data.sources).toEqual([]);
      expect(fakeAi.lastChatParams).toBeNull();
    });

    it('(b) admin asking same question gets answer with Grade B source', async () => {
      fakeAi.setMockAnswer('Chiến dịch Điện Biên Phủ năm 1954 bắt sống tướng Đờ Cát.');

      const res = await request(app.getHttpServer())
        .post('/api/ai/chat')
        .set('Cookie', adminCookie)
        .send({ question: 'Chiến dịch Điện Biên Phủ 1954 bắt sống tướng nào?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBe('Chiến dịch Điện Biên Phủ năm 1954 bắt sống tướng Đờ Cát.');
      expect(res.body.data.sources.length).toBeGreaterThan(0);
      expect(res.body.data.sources[0]?.slug).toBe('dien-bien-phu-e2e-grade-b');
    });
    it('(c) student in Grade A gets 403 LESSON_GRADE_RESTRICTED when passing lessonId of Grade B', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/chat')
        .set('Cookie', studentLopACookie)
        .send({
          question: 'Hỏi về chiến dịch Điện Biên Phủ',
          lessonId: gradeBLessonId,
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe(ErrorCodes.LESSON_GRADE_RESTRICTED);
    });

    it('(d) student in Grade A gets 200 when passing lessonId of Grade A', async () => {
      fakeAi.setMockAnswer('Ngô Quyền cắm cọc ngầm.');
      const res = await request(app.getHttpServer())
        .post('/api/ai/chat')
        .set('Cookie', studentLopACookie)
        .send({
          question: 'Hỏi về trận Bạch Đằng',
          lessonId: publishedLessonId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('(e) user without grade gets 403 LESSON_GRADE_RESTRICTED when passing lessonId of non-featured lesson', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/chat')
        .set('Cookie', userCookie)
        .send({
          question: 'Hỏi về Điện Biên Phủ',
          lessonId: gradeBLessonId,
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe(ErrorCodes.LESSON_GRADE_RESTRICTED);
    });
  });
});
