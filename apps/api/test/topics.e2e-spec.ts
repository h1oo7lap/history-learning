import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAdminCookie(app: INestApplication, prisma: PrismaService) {
  const email = 'admin-topics@example.com';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1', fullName: 'Admin Topics' });

  await prisma.user.updateMany({
    where: { email },
    data: { role: 'ADMIN' },
  });

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: 'Password1' });

  const setCookie = res.headers['set-cookie'];
  return Array.isArray(setCookie) ? setCookie[0] ?? '' : String(setCookie ?? '');
}

async function getUserCookie(app: INestApplication) {
  const email = 'user-topics@example.com';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1', fullName: 'Regular User' });

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: 'Password1' });

  const setCookie = res.headers['set-cookie'];
  return Array.isArray(setCookie) ? setCookie[0] ?? '' : String(setCookie ?? '');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Topics (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear all topics and reset auth tables
    await prisma.$executeRaw`TRUNCATE TABLE topics CASCADE`;
    await clearAuthTables(prisma);
    adminCookie = await getAdminCookie(app, prisma);
    userCookie = await getUserCookie(app);
  });

  // ──────────────────────────────────────────────
  // POST /api/admin/topics — Create
  // ──────────────────────────────────────────────
  describe('POST /api/admin/topics', () => {
    it('admin can create a topic', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/topics')
        .set('Cookie', adminCookie)
        .send({ name: 'Lịch sử Việt Nam', displayOrder: 1 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: 'Lịch sử Việt Nam',
        slug: 'lich-su-viet-nam',
        status: 'ACTIVE',
        displayOrder: 1,
      });
      expect(res.body.data).toHaveProperty('id');
    });

    it('auto-generates a unique slug when same name is used twice', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/topics')
        .set('Cookie', adminCookie)
        .send({ name: 'Topic A' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/admin/topics')
        .set('Cookie', adminCookie)
        .send({ name: 'Topic A' })
        .expect(201);

      expect(res.body.data.slug).toBe('topic-a-1');
    });

    it('uses provided slug when given', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/topics')
        .set('Cookie', adminCookie)
        .send({ name: 'My Topic', slug: 'custom-slug' })
        .expect(201);

      expect(res.body.data.slug).toBe('custom-slug');
    });

    it('returns 403 for USER role', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/topics')
        .set('Cookie', userCookie)
        .send({ name: 'Unauthorized' })
        .expect(403);
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/topics')
        .send({ name: 'No auth' })
        .expect(401);
    });

    it('returns 400 for invalid body (name too short)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/topics')
        .set('Cookie', adminCookie)
        .send({ name: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/topics — Admin list
  // ──────────────────────────────────────────────
  describe('GET /api/admin/topics', () => {
    beforeEach(async () => {
      // Seed 3 topics: 2 ACTIVE, 1 INACTIVE
      await prisma.topic.createMany({
        data: [
          { name: 'Alpha', slug: 'alpha', status: 'ACTIVE', displayOrder: 1 },
          { name: 'Beta', slug: 'beta', status: 'ACTIVE', displayOrder: 2 },
          { name: 'Gamma', slug: 'gamma', status: 'INACTIVE', displayOrder: 3 },
        ],
      });
    });

    it('admin sees all topics regardless of status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/topics')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.items).toHaveLength(3);
    });

    it('admin can filter by status=INACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/topics?status=INACTIVE')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].slug).toBe('gamma');
    });

    it('admin can search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/topics?search=lph')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Alpha');
    });

    it('pagination metadata is correct', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/topics?page=1&pageSize=2')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.page).toBe(1);
      expect(res.body.data.pageSize).toBe(2);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.totalPages).toBe(2);
      expect(res.body.data.items).toHaveLength(2);
    });

    it('returns 403 for USER role', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/topics')
        .set('Cookie', userCookie)
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/topics/:id
  // ──────────────────────────────────────────────
  describe('GET /api/admin/topics/:id', () => {
    it('admin can get topic by ID', async () => {
      const created = await prisma.topic.create({
        data: { name: 'Test Topic', slug: 'test-topic' },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/admin/topics/${created.id}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.id).toBe(created.id);
      expect(res.body.data.name).toBe('Test Topic');
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/topics/non-existent-id')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body).toMatchObject({
        success: false,
        errorCode: 'TOPIC_NOT_FOUND',
      });
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /api/admin/topics/:id — Update
  // ──────────────────────────────────────────────
  describe('PATCH /api/admin/topics/:id', () => {
    it('admin can update topic name and status', async () => {
      const created = await prisma.topic.create({
        data: { name: 'Old Name', slug: 'old-name' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/topics/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'New Name', status: 'INACTIVE' })
        .expect(200);

      expect(res.body.data.name).toBe('New Name');
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('regenerates slug automatically when name changes without explicit slug', async () => {
      const created = await prisma.topic.create({
        data: { name: 'Original Name', slug: 'original-name' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/topics/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'Renamed Topic' })
        .expect(200);

      expect(res.body.data.slug).toBe('renamed-topic');
    });

    it('returns 409 when explicit slug conflicts with another topic', async () => {
      await prisma.topic.create({ data: { name: 'First', slug: 'first' } });
      const second = await prisma.topic.create({
        data: { name: 'Second', slug: 'second' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/topics/${second.id}`)
        .set('Cookie', adminCookie)
        .send({ slug: 'first' })
        .expect(409);

      expect(res.body.errorCode).toBe('SLUG_TAKEN');
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/topics/bad-id')
        .set('Cookie', adminCookie)
        .send({ name: 'Updated' })
        .expect(404);

      expect(res.body.errorCode).toBe('TOPIC_NOT_FOUND');
    });

    it('returns 403 for USER role', async () => {
      const created = await prisma.topic.create({
        data: { name: 'T', slug: 't' },
      });
      await request(app.getHttpServer())
        .patch(`/api/admin/topics/${created.id}`)
        .set('Cookie', userCookie)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/admin/topics/:id
  // ──────────────────────────────────────────────
  describe('DELETE /api/admin/topics/:id', () => {
    it('admin can delete a topic', async () => {
      const created = await prisma.topic.create({
        data: { name: 'To Delete', slug: 'to-delete' },
      });

      await request(app.getHttpServer())
        .delete(`/api/admin/topics/${created.id}`)
        .set('Cookie', adminCookie)
        .expect(204);

      const found = await prisma.topic.findUnique({
        where: { id: created.id },
      });
      expect(found).toBeNull();
    });

    it('returns 404 when deleting non-existent topic', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/admin/topics/no-such-id')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body.errorCode).toBe('TOPIC_NOT_FOUND');
    });

    it('returns 403 for USER role', async () => {
      const created = await prisma.topic.create({
        data: { name: 'Protected', slug: 'protected' },
      });
      await request(app.getHttpServer())
        .delete(`/api/admin/topics/${created.id}`)
        .set('Cookie', userCookie)
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/topics — Public list (ACTIVE only)
  // ──────────────────────────────────────────────
  describe('GET /api/topics (public)', () => {
    beforeEach(async () => {
      await prisma.topic.createMany({
        data: [
          { name: 'Active One', slug: 'active-one', status: 'ACTIVE', displayOrder: 1 },
          { name: 'Active Two', slug: 'active-two', status: 'ACTIVE', displayOrder: 2 },
          { name: 'Hidden', slug: 'hidden', status: 'INACTIVE', displayOrder: 3 },
        ],
      });
    });

    it('returns only ACTIVE topics without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/topics')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.items.every((t: { status: string }) => t.status === 'ACTIVE')).toBe(true);
    });

    it('does not require authentication', async () => {
      await request(app.getHttpServer()).get('/api/topics').expect(200);
    });

    it('supports pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/topics?page=1&pageSize=1')
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.totalPages).toBe(2);
    });

    it('supports search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/topics?search=One')
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Active One');
    });

    it('never exposes INACTIVE topics in public endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/topics?status=INACTIVE')
        .expect(200);

      // status filter is ignored by the public endpoint; still only ACTIVE
      expect(
        res.body.data.items.every((t: { status: string }) => t.status === 'ACTIVE'),
      ).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/topics/:slug — Public single
  // ──────────────────────────────────────────────
  describe('GET /api/topics/:slug (public)', () => {
    it('returns an active topic by slug', async () => {
      await prisma.topic.create({
        data: { name: 'Vietnam History', slug: 'vietnam-history', status: 'ACTIVE' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/topics/vietnam-history')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('vietnam-history');
    });

    it('returns 404 for inactive topic', async () => {
      await prisma.topic.create({
        data: { name: 'Inactive', slug: 'inactive-topic', status: 'INACTIVE' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/topics/inactive-topic')
        .expect(404);

      expect(res.body.errorCode).toBe('TOPIC_NOT_FOUND');
    });

    it('returns 404 for non-existent slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/topics/does-not-exist')
        .expect(404);

      expect(res.body.errorCode).toBe('TOPIC_NOT_FOUND');
    });
  });
});
