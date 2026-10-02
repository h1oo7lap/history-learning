import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAdminCookie(app: INestApplication, prisma: PrismaService) {
  const email = 'admin-periods@example.com';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1', fullName: 'Admin Periods' });

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
  const email = 'user-periods@example.com';
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

describe('Periods (e2e)', () => {
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
    await prisma.$executeRaw`TRUNCATE TABLE historical_periods CASCADE`;
    await clearAuthTables(prisma);
    adminCookie = await getAdminCookie(app, prisma);
    userCookie = await getUserCookie(app);
  });

  // ──────────────────────────────────────────────
  // POST /api/admin/periods — Create
  // ──────────────────────────────────────────────
  describe('POST /api/admin/periods', () => {
    it('admin can create a period', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/periods')
        .set('Cookie', adminCookie)
        .send({ name: 'Thời kỳ Bắc thuộc', startYear: -179, endYear: 938, displayOrder: 1 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: 'Thời kỳ Bắc thuộc',
        slug: 'thoi-ky-bac-thuoc',
        status: 'ACTIVE',
        startYear: -179,
        endYear: 938,
        displayOrder: 1,
      });
      expect(res.body.data).toHaveProperty('id');
    });

    it('auto-generates a unique slug when same name is used twice', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/periods')
        .set('Cookie', adminCookie)
        .send({ name: 'Period A' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/admin/periods')
        .set('Cookie', adminCookie)
        .send({ name: 'Period A' })
        .expect(201);

      expect(res.body.data.slug).toBe('period-a-1');
    });

    it('uses provided slug when given', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/periods')
        .set('Cookie', adminCookie)
        .send({ name: 'My Period', slug: 'custom-period-slug' })
        .expect(201);

      expect(res.body.data.slug).toBe('custom-period-slug');
    });

    it('creates period without startYear/endYear (nullable)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/periods')
        .set('Cookie', adminCookie)
        .send({ name: 'Period No Dates' })
        .expect(201);

      expect(res.body.data.startYear).toBeNull();
      expect(res.body.data.endYear).toBeNull();
    });

    it('returns 403 for USER role', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/periods')
        .set('Cookie', userCookie)
        .send({ name: 'Unauthorized' })
        .expect(403);
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/periods')
        .send({ name: 'No auth' })
        .expect(401);
    });

    it('returns 400 for invalid body (name too short)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/periods')
        .set('Cookie', adminCookie)
        .send({ name: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/periods — Admin list
  // ──────────────────────────────────────────────
  describe('GET /api/admin/periods', () => {
    beforeEach(async () => {
      await prisma.historicalPeriod.createMany({
        data: [
          { name: 'Alpha Period', slug: 'alpha-period', status: 'ACTIVE', displayOrder: 1 },
          { name: 'Beta Period', slug: 'beta-period', status: 'ACTIVE', displayOrder: 2 },
          { name: 'Gamma Period', slug: 'gamma-period', status: 'INACTIVE', displayOrder: 3 },
        ],
      });
    });

    it('admin sees all periods regardless of status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/periods')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.items).toHaveLength(3);
    });

    it('admin can filter by status=INACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/periods?status=INACTIVE')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].slug).toBe('gamma-period');
    });

    it('admin can search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/periods?search=lpha')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Alpha Period');
    });

    it('pagination metadata is correct', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/periods?page=1&pageSize=2')
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
        .get('/api/admin/periods')
        .set('Cookie', userCookie)
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/periods/:id
  // ──────────────────────────────────────────────
  describe('GET /api/admin/periods/:id', () => {
    it('admin can get period by ID', async () => {
      const created = await prisma.historicalPeriod.create({
        data: { name: 'Test Period', slug: 'test-period', startYear: 1000, endYear: 1200 },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/admin/periods/${created.id}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.id).toBe(created.id);
      expect(res.body.data.name).toBe('Test Period');
      expect(res.body.data.startYear).toBe(1000);
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/periods/non-existent-id')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body).toMatchObject({
        success: false,
        errorCode: 'PERIOD_NOT_FOUND',
      });
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /api/admin/periods/:id — Update
  // ──────────────────────────────────────────────
  describe('PATCH /api/admin/periods/:id', () => {
    it('admin can update period name and status', async () => {
      const created = await prisma.historicalPeriod.create({
        data: { name: 'Old Period', slug: 'old-period' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/periods/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'New Period', status: 'INACTIVE' })
        .expect(200);

      expect(res.body.data.name).toBe('New Period');
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('admin can update startYear and endYear', async () => {
      const created = await prisma.historicalPeriod.create({
        data: { name: 'Year Period', slug: 'year-period' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/periods/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ startYear: -500, endYear: 100 })
        .expect(200);

      expect(res.body.data.startYear).toBe(-500);
      expect(res.body.data.endYear).toBe(100);
    });

    it('regenerates slug automatically when name changes without explicit slug', async () => {
      const created = await prisma.historicalPeriod.create({
        data: { name: 'Original Period', slug: 'original-period' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/periods/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'Renamed Period' })
        .expect(200);

      expect(res.body.data.slug).toBe('renamed-period');
    });

    it('returns 409 when explicit slug conflicts with another period', async () => {
      await prisma.historicalPeriod.create({ data: { name: 'First', slug: 'first-period' } });
      const second = await prisma.historicalPeriod.create({
        data: { name: 'Second', slug: 'second-period' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/periods/${second.id}`)
        .set('Cookie', adminCookie)
        .send({ slug: 'first-period' })
        .expect(409);

      expect(res.body.errorCode).toBe('SLUG_TAKEN');
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/periods/bad-id')
        .set('Cookie', adminCookie)
        .send({ name: 'Updated' })
        .expect(404);

      expect(res.body.errorCode).toBe('PERIOD_NOT_FOUND');
    });

    it('returns 403 for USER role', async () => {
      const created = await prisma.historicalPeriod.create({
        data: { name: 'P', slug: 'p' },
      });
      await request(app.getHttpServer())
        .patch(`/api/admin/periods/${created.id}`)
        .set('Cookie', userCookie)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/admin/periods/:id
  // ──────────────────────────────────────────────
  describe('DELETE /api/admin/periods/:id', () => {
    it('admin can delete a period', async () => {
      const created = await prisma.historicalPeriod.create({
        data: { name: 'To Delete', slug: 'to-delete-period' },
      });

      await request(app.getHttpServer())
        .delete(`/api/admin/periods/${created.id}`)
        .set('Cookie', adminCookie)
        .expect(204);

      const found = await prisma.historicalPeriod.findUnique({
        where: { id: created.id },
      });
      expect(found).toBeNull();
    });

    it('returns 404 when deleting non-existent period', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/admin/periods/no-such-id')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body.errorCode).toBe('PERIOD_NOT_FOUND');
    });

    it('returns 403 for USER role', async () => {
      const created = await prisma.historicalPeriod.create({
        data: { name: 'Protected', slug: 'protected-period' },
      });
      await request(app.getHttpServer())
        .delete(`/api/admin/periods/${created.id}`)
        .set('Cookie', userCookie)
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/periods — Public list (ACTIVE only)
  // ──────────────────────────────────────────────
  describe('GET /api/periods (public)', () => {
    beforeEach(async () => {
      await prisma.historicalPeriod.createMany({
        data: [
          { name: 'Active One', slug: 'active-one-period', status: 'ACTIVE', displayOrder: 1 },
          { name: 'Active Two', slug: 'active-two-period', status: 'ACTIVE', displayOrder: 2 },
          { name: 'Hidden Period', slug: 'hidden-period', status: 'INACTIVE', displayOrder: 3 },
        ],
      });
    });

    it('returns only ACTIVE periods without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/periods')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(
        res.body.data.items.every((p: { status: string }) => p.status === 'ACTIVE'),
      ).toBe(true);
    });

    it('does not require authentication', async () => {
      await request(app.getHttpServer()).get('/api/periods').expect(200);
    });

    it('supports pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/periods?page=1&pageSize=1')
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.totalPages).toBe(2);
    });

    it('supports search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/periods?search=One')
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Active One');
    });

    it('never exposes INACTIVE periods in public endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/periods?status=INACTIVE')
        .expect(200);

      expect(
        res.body.data.items.every((p: { status: string }) => p.status === 'ACTIVE'),
      ).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/periods/:slug — Public single
  // ──────────────────────────────────────────────
  describe('GET /api/periods/:slug (public)', () => {
    it('returns an active period by slug', async () => {
      await prisma.historicalPeriod.create({
        data: { name: 'Nam Viet Kingdom', slug: 'nam-viet-kingdom', status: 'ACTIVE' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/periods/nam-viet-kingdom')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('nam-viet-kingdom');
    });

    it('returns 404 for inactive period', async () => {
      await prisma.historicalPeriod.create({
        data: { name: 'Inactive Period', slug: 'inactive-period-slug', status: 'INACTIVE' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/periods/inactive-period-slug')
        .expect(404);

      expect(res.body.errorCode).toBe('PERIOD_NOT_FOUND');
    });

    it('returns 404 for non-existent slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/periods/does-not-exist')
        .expect(404);

      expect(res.body.errorCode).toBe('PERIOD_NOT_FOUND');
    });
  });
});
