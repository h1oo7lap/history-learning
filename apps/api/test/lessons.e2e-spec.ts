/**
 * Lessons e2e tests
 *
 * Covers:
 *  - Legacy HTML content (backward compat)
 *  - Block-based contentJson CRUD
 *  - Validation rejections
 *  - XSS safety
 *  - Publish rules (text required, grade required)
 *  - Public vs admin visibility
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAdminCookie(app: INestApplication, prisma: PrismaService) {
  const email = 'admin-lessons@example.com';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1!', fullName: 'Admin Lessons' });

  await prisma.user.updateMany({
    where: { email },
    data: { role: 'ADMIN' },
  });

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: 'Password1!' });

  const setCookie = res.headers['set-cookie'];
  return Array.isArray(setCookie) ? setCookie[0] ?? '' : String(setCookie ?? '');
}

async function clearLessons(prisma: PrismaService) {
  // Cascade deletes all lesson relations
  await prisma.$executeRaw`TRUNCATE TABLE lessons CASCADE`;
}

// A valid Cloudinary URL for the test cloud (read from env — populated by vitest envFile)
// Tests use a "fake" but structurally valid URL; validation only checks hostname + cloud prefix.
function cloudinaryUrl(path = 'image/upload/sample.jpg'): string {
  const cloud = process.env['CLOUDINARY_CLOUD_NAME'] ?? 'dshyrky7d';
  return `https://res.cloudinary.com/${cloud}/${path}`;
}

let gradeId: string;

/** Minimal valid lesson DTO (legacy HTML mode) */
function legacyLessonDto(overrides: any = {}) {
  return {
    title: 'Bài học lịch sử số 1',
    content: '<p>Nội dung bài học</p>',
    difficulty: 'EASY',
    estimatedTime: 10,
    displayOrder: 0,
    gradeId,
    ...overrides,
  };
}

/** Minimal valid lesson DTO with contentJson (block mode) */
function blockLessonDto(overrides: any = {}) {
  return {
    title: 'Bài học block-based',
    content: '', // ignored by server when contentJson is present
    difficulty: 'EASY',
    estimatedTime: 10,
    displayOrder: 0,
    gradeId,
    contentJson: {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: 'Nội dung bài học từ block' }],
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Lessons (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookie: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());

    // We need at least one grade for publish tests
    // Use existing grade or create one
    const existing = await prisma.grade.findFirst();
    if (existing) {
      gradeId = existing.id;
    } else {
      const level = await prisma.educationLevel.create({
        data: { name: 'Tiểu học', code: 'PRIMARY', displayOrder: 1 },
      });
      const grade = await prisma.grade.create({
        data: {
          educationLevelId: level.id,
          name: 'Lớp 4',
          code: 'GRADE_4_TEST',
          displayOrder: 1,
        },
      });
      gradeId = grade.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearLessons(prisma);
    await clearAuthTables(prisma);
    adminCookie = await getAdminCookie(app, prisma);
  });

  // ==========================================================================
  // POST /api/admin/lessons — Create
  // ==========================================================================

  describe('POST /api/admin/lessons', () => {
    // ── Legacy HTML mode ────────────────────────────────────────────────────

    it('admin can create a lesson in legacy HTML mode', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(legacyLessonDto())
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Bài học lịch sử số 1');
      expect(res.body.data.contentJson).toBeNull();
      // content stored and returned in detail
    });

    // ── Block mode ──────────────────────────────────────────────────────────

    it('admin can create a lesson with contentJson', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(blockLessonDto())
        .expect(201);

      expect(res.body.success).toBe(true);
      const lesson = res.body.data;
      expect(lesson.contentJson).toBeDefined();
      expect(lesson.contentJson.version).toBe(1);
      expect(lesson.contentJson.blocks).toHaveLength(1);
      expect(lesson.contentJson.blocks[0].type).toBe('text');
      // content auto-generated from blocks
      expect(lesson.content).toContain('Nội dung bài học từ block');
    });

    it('block order is preserved', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                { id: 'a', type: 'text', text: 'Block A' },
                { id: 'b', type: 'video', youtubeId: 'dQw4w9WgXcQ' },
                { id: 'c', type: 'text', text: 'Block C' },
              ],
            },
          }),
        )
        .expect(201);

      const blocks = res.body.data.contentJson.blocks;
      expect(blocks[0].id).toBe('a');
      expect(blocks[1].id).toBe('b');
      expect(blocks[2].id).toBe('c');
    });

    it('generated content contains text blocks in order and skips non-text', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                { id: 'a', type: 'text', text: 'Paragraph one' },
                { id: 'b', type: 'video', youtubeId: 'dQw4w9WgXcQ' },
                { id: 'c', type: 'text', text: 'Paragraph two' },
              ],
            },
          }),
        )
        .expect(201);

      const content: string = res.body.data.content;
      expect(content).toContain('<p>Paragraph one</p>');
      expect(content).toContain('<p>Paragraph two</p>');
      expect(content).not.toContain('dQw4w9WgXcQ');
    });

    it('XSS: <script> in text block is escaped in generated content', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                { id: 'b1', type: 'text', text: '<script>alert(1)</script>' },
              ],
            },
          }),
        )
        .expect(201);

      const content: string = res.body.data.content;
      expect(content).not.toContain('<script>');
      expect(content).toContain('&lt;script&gt;');
    });

    it('XSS: <img onerror> in text block is escaped', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [{ id: 'b1', type: 'text', text: '<img src=x onerror=alert(1)>' }],
            },
          }),
        )
        .expect(201);

      const content: string = res.body.data.content;
      expect(content).not.toContain('<img');
    });

    // ── Validation rejections ───────────────────────────────────────────────

    it('rejects unknown block type', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [{ id: 'b1', type: 'quiz', question: 'What?' }],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects image block missing alt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                {
                  id: 'b1',
                  type: 'image',
                  url: cloudinaryUrl(),
                  // alt intentionally omitted
                },
              ],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects duplicate block IDs', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                { id: 'dup', type: 'text', text: 'First' },
                { id: 'dup', type: 'text', text: 'Second' },
              ],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects more than 100 blocks', async () => {
      const blocks = Array.from({ length: 101 }, (_, i) => ({
        id: `b${i}`,
        type: 'text',
        text: 'content',
      }));

      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(blockLessonDto({ contentJson: { version: 1, blocks } }))
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects empty text block (whitespace only)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [{ id: 'b1', type: 'text', text: '   ' }],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects text block exceeding 10,000 chars', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [{ id: 'b1', type: 'text', text: 'a'.repeat(10_001) }],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects image URL with http: scheme', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                {
                  id: 'b1',
                  type: 'image',
                  url: 'http://res.cloudinary.com/dshyrky7d/image/upload/x.jpg',
                  alt: 'test',
                },
              ],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects image URL with data: scheme', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                {
                  id: 'b1',
                  type: 'image',
                  url: 'data:image/png;base64,abc123',
                  alt: 'test',
                },
              ],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('accepts image URL from an external https domain', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                {
                  id: 'b1',
                  type: 'image',
                  url: 'https://example.com/image.jpg',
                  alt: 'test',
                },
              ],
            },
          }),
        )
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('rejects image URL from wrong Cloudinary cloud name', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                {
                  id: 'b1',
                  type: 'image',
                  url: 'https://res.cloudinary.com/WRONG_CLOUD/image/upload/x.jpg',
                  alt: 'test',
                },
              ],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects youtubeId with invalid format (full URL)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                {
                  id: 'b1',
                  type: 'video',
                  youtubeId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                },
              ],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects youtubeId with wrong length', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [{ id: 'b1', type: 'video', youtubeId: 'short' }],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects youtubeId with special characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [{ id: 'b1', type: 'video', youtubeId: 'invalid!chars' }],
            },
          }),
        )
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('rejects non-admin creating a lesson', async () => {
      // Register regular user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'user-l@example.com', password: 'Password1!', fullName: 'User' });
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user-l@example.com', password: 'Password1!' });
      const userCookie = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie'][0] ?? ''
        : String(loginRes.headers['set-cookie'] ?? '');

      await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', userCookie)
        .send(legacyLessonDto())
        .expect(403);
    });
  });

  // ==========================================================================
  // GET /api/admin/lessons/:id — Admin detail
  // ==========================================================================

  describe('GET /api/admin/lessons/:id', () => {
    it('returns contentJson in admin detail', async () => {
      // Create with blocks
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(blockLessonDto())
        .expect(201);

      const id: string = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.contentJson).toBeDefined();
      expect(res.body.data.contentJson.blocks).toHaveLength(1);
    });

    it('legacy lesson has contentJson=null in admin detail', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(legacyLessonDto())
        .expect(201);

      const id: string = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.contentJson).toBeNull();
    });
  });

  // ==========================================================================
  // GET /api/admin/lessons — Admin list (no content/contentJson)
  // ==========================================================================

  describe('GET /api/admin/lessons (list)', () => {
    it('list does not include content or contentJson fields', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(blockLessonDto())
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .expect(200);

      const item = res.body.data.items[0];
      expect(item.content).toBeUndefined();
      expect(item.contentJson).toBeUndefined();
    });
  });

  // ==========================================================================
  // PATCH /api/admin/lessons/:id — Update
  // ==========================================================================

  describe('PATCH /api/admin/lessons/:id', () => {
    it('PATCH changes block order and stores new order', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                { id: 'a', type: 'text', text: 'First' },
                { id: 'b', type: 'text', text: 'Second' },
              ],
            },
          }),
        )
        .expect(201);

      const id: string = createRes.body.data.id;

      const patchRes = await request(app.getHttpServer())
        .patch(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .send({
          contentJson: {
            version: 1,
            blocks: [
              { id: 'b', type: 'text', text: 'Second' },
              { id: 'a', type: 'text', text: 'First' },
            ],
          },
        })
        .expect(200);

      const blocks = patchRes.body.data.contentJson.blocks;
      expect(blocks[0].id).toBe('b');
      expect(blocks[1].id).toBe('a');
    });

    it('PATCH contentJson=null reverts to legacy HTML mode', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(blockLessonDto())
        .expect(201);

      const id: string = createRes.body.data.id;

      const patchRes = await request(app.getHttpServer())
        .patch(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .send({
          contentJson: null,
          content: '<p>Legacy content now</p>',
        })
        .expect(200);

      expect(patchRes.body.data.contentJson).toBeNull();
    });
  });

  // ==========================================================================
  // Publish validation
  // ==========================================================================

  describe('Publish validation', () => {
    it('fails to publish lesson with only image/video blocks (no text)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                { id: 'b1', type: 'video', youtubeId: 'dQw4w9WgXcQ' },
                { id: 'b2', type: 'image', url: cloudinaryUrl(), alt: 'img' },
              ],
            },
          }),
        )
        .expect(201);

      const id: string = createRes.body.data.id;

      const patchRes = await request(app.getHttpServer())
        .patch(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .send({
          status: 'PUBLISHED',
          gradeId,
        })
        .expect(422);

      expect(patchRes.body.success).toBe(false);
    });

    it('successfully publishes lesson with text block + grade', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(
          blockLessonDto({
            contentJson: {
              version: 1,
              blocks: [
                { id: 'b1', type: 'text', text: 'Nội dung có chữ để publish' },
                { id: 'b2', type: 'video', youtubeId: 'dQw4w9WgXcQ' },
              ],
            },
          }),
        )
        .expect(201);

      const id: string = createRes.body.data.id;

      const patchRes = await request(app.getHttpServer())
        .patch(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .send({
          status: 'PUBLISHED',
          gradeId,
        })
        .expect(200);

      expect(patchRes.body.data.status).toBe('PUBLISHED');
    });

    it('legacy lesson still publishes normally with content + grade', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(legacyLessonDto())
        .expect(201);

      const id: string = createRes.body.data.id;

      const patchRes = await request(app.getHttpServer())
        .patch(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .send({
          status: 'PUBLISHED',
          gradeId,
        })
        .expect(200);

      expect(patchRes.body.data.status).toBe('PUBLISHED');
    });
  });

  // ==========================================================================
  // Public endpoints
  // ==========================================================================

  describe('Public endpoints', () => {
    async function createAndPublishLesson(extra = {}) {
      // Create
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(blockLessonDto(extra))
        .expect(201);

      const id: string = createRes.body.data.id;

      // Publish
      await request(app.getHttpServer())
        .patch(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED', gradeId })
        .expect(200);

      return id;
    }

    it('public list does not return DRAFT/ARCHIVED lessons', async () => {
      // Create draft
      await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(legacyLessonDto({ title: 'Draft lesson' }))
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/lessons')
        .expect(200);

      expect(res.body.data.items).toHaveLength(0);
    });

    it('public list does not include content or contentJson', async () => {
      await createAndPublishLesson();

      const res = await request(app.getHttpServer())
        .get('/api/lessons')
        .expect(200);

      const item = res.body.data.items[0];
      expect(item.content).toBeUndefined();
      expect(item.contentJson).toBeUndefined();
    });

    it('public detail returns contentJson for published block lesson', async () => {
      // Create and get the lesson slug
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(blockLessonDto())
        .expect(201);

      const id: string = createRes.body.data.id;
      const slug: string = createRes.body.data.slug;

      await request(app.getHttpServer())
        .patch(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED', gradeId })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/lessons/${slug}`)
        .expect(200);

      expect(res.body.data.contentJson).toBeDefined();
      expect(res.body.data.contentJson.blocks).toHaveLength(1);
    });

    it('public detail for legacy lesson returns contentJson=null', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(legacyLessonDto())
        .expect(201);

      const id: string = createRes.body.data.id;
      const slug: string = createRes.body.data.slug;

      await request(app.getHttpServer())
        .patch(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .send({ status: 'PUBLISHED', gradeId })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/lessons/${slug}`)
        .expect(200);

      expect(res.body.data.contentJson).toBeNull();
    });

    it('public detail returns 404 for DRAFT lesson', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(legacyLessonDto())
        .expect(201);

      const slug: string = createRes.body.data.slug;

      await request(app.getHttpServer())
        .get(`/api/lessons/${slug}`)
        .expect(404);
    });

    it('public detail returns 404 for ARCHIVED lesson', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(legacyLessonDto())
        .expect(201);

      const id: string = createRes.body.data.id;
      const slug: string = createRes.body.data.slug;

      // Archive it
      await request(app.getHttpServer())
        .delete(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/lessons/${slug}`)
        .expect(404);
    });
  });

  // ==========================================================================
  // DELETE (archive)
  // ==========================================================================

  describe('DELETE /api/admin/lessons/:id', () => {
    it('archives lesson instead of hard delete', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/lessons')
        .set('Cookie', adminCookie)
        .send(legacyLessonDto())
        .expect(201);

      const id: string = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/admin/lessons/${id}`)
        .set('Cookie', adminCookie)
        .expect(204);

      const lesson = await prisma.lesson.findUnique({ where: { id } });
      expect(lesson?.status).toBe('ARCHIVED');
    });
  });
});
