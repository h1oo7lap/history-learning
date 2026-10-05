import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAdminCookie(app: INestApplication, prisma: PrismaService) {
  const email = 'admin-events@example.com';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1', fullName: 'Admin Events' });

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
  const email = 'user-events@example.com';
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

describe('Events (e2e)', () => {
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
    await prisma.$executeRaw`TRUNCATE TABLE historical_events CASCADE`;
    await clearAuthTables(prisma);
    adminCookie = await getAdminCookie(app, prisma);
    userCookie = await getUserCookie(app);
  });

  // ──────────────────────────────────────────────
  // POST /api/admin/events — Create
  // ──────────────────────────────────────────────
  describe('POST /api/admin/events', () => {
    it('admin can create an event', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/events')
        .set('Cookie', adminCookie)
        .send({
          name: 'Chiến thắng Bạch Đằng',
          description: 'Trận thủy chiến trên sông Bạch Đằng',
          startDate: '0938-01-01T00:00:00.000Z',
          location: 'Sông Bạch Đằng',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: 'Chiến thắng Bạch Đằng',
        slug: 'chien-thang-bach-dang',
        status: 'ACTIVE',
        description: 'Trận thủy chiến trên sông Bạch Đằng',
        location: 'Sông Bạch Đằng',
      });
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.startDate).toBeTruthy();
    });

    it('auto-generates a unique slug when same name is used twice', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/events')
        .set('Cookie', adminCookie)
        .send({ name: 'Event A' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/admin/events')
        .set('Cookie', adminCookie)
        .send({ name: 'Event A' })
        .expect(201);

      expect(res.body.data.slug).toBe('event-a-1');
    });

    it('uses provided slug when given', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/events')
        .set('Cookie', adminCookie)
        .send({ name: 'My Event', slug: 'custom-event-slug' })
        .expect(201);

      expect(res.body.data.slug).toBe('custom-event-slug');
    });

    it('creates event without dates and location (nullable)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/events')
        .set('Cookie', adminCookie)
        .send({ name: 'Event No Dates' })
        .expect(201);

      expect(res.body.data.startDate).toBeNull();
      expect(res.body.data.endDate).toBeNull();
      expect(res.body.data.location).toBeNull();
    });

    it('returns 403 for USER role', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/events')
        .set('Cookie', userCookie)
        .send({ name: 'Unauthorized' })
        .expect(403);
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/events')
        .send({ name: 'No auth' })
        .expect(401);
    });

    it('returns 400 for invalid body (name too short)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/events')
        .set('Cookie', adminCookie)
        .send({ name: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/events — Admin list
  // ──────────────────────────────────────────────
  describe('GET /api/admin/events', () => {
    beforeEach(async () => {
      await prisma.historicalEvent.createMany({
        data: [
          { name: 'Alpha Event', slug: 'alpha-event', status: 'ACTIVE' },
          { name: 'Beta Event', slug: 'beta-event', status: 'ACTIVE' },
          { name: 'Gamma Event', slug: 'gamma-event', status: 'INACTIVE' },
        ],
      });
    });

    it('admin sees all events regardless of status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/events')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.items).toHaveLength(3);
    });

    it('admin can filter by status=INACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/events?status=INACTIVE')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].slug).toBe('gamma-event');
    });

    it('admin can search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/events?search=lpha')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Alpha Event');
    });

    it('pagination metadata is correct', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/events?page=1&pageSize=2')
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
        .get('/api/admin/events')
        .set('Cookie', userCookie)
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/events/:id
  // ──────────────────────────────────────────────
  describe('GET /api/admin/events/:id', () => {
    it('admin can get event by ID', async () => {
      const created = await prisma.historicalEvent.create({
        data: {
          name: 'Test Event',
          slug: 'test-event',
          location: 'Hà Nội',
          startDate: new Date('1010-01-01'),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/admin/events/${created.id}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.id).toBe(created.id);
      expect(res.body.data.name).toBe('Test Event');
      expect(res.body.data.location).toBe('Hà Nội');
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/events/non-existent-id')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body).toMatchObject({
        success: false,
        errorCode: 'EVENT_NOT_FOUND',
      });
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /api/admin/events/:id — Update
  // ──────────────────────────────────────────────
  describe('PATCH /api/admin/events/:id', () => {
    it('admin can update event name and status', async () => {
      const created = await prisma.historicalEvent.create({
        data: { name: 'Old Event', slug: 'old-event' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/events/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'New Event', status: 'INACTIVE' })
        .expect(200);

      expect(res.body.data.name).toBe('New Event');
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('admin can update dates and location', async () => {
      const created = await prisma.historicalEvent.create({
        data: { name: 'Date Event', slug: 'date-event' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/events/${created.id}`)
        .set('Cookie', adminCookie)
        .send({
          startDate: '1945-09-02T00:00:00.000Z',
          endDate: '1945-09-02T23:59:59.000Z',
          location: 'Ba Đình, Hà Nội',
        })
        .expect(200);

      expect(res.body.data.startDate).toBeTruthy();
      expect(res.body.data.location).toBe('Ba Đình, Hà Nội');
    });

    it('regenerates slug automatically when name changes without explicit slug', async () => {
      const created = await prisma.historicalEvent.create({
        data: { name: 'Original Event', slug: 'original-event' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/events/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'Renamed Event' })
        .expect(200);

      expect(res.body.data.slug).toBe('renamed-event');
    });

    it('returns 409 when explicit slug conflicts with another event', async () => {
      await prisma.historicalEvent.create({ data: { name: 'First', slug: 'first-event' } });
      const second = await prisma.historicalEvent.create({
        data: { name: 'Second', slug: 'second-event' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/events/${second.id}`)
        .set('Cookie', adminCookie)
        .send({ slug: 'first-event' })
        .expect(409);

      expect(res.body.errorCode).toBe('SLUG_TAKEN');
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/events/bad-id')
        .set('Cookie', adminCookie)
        .send({ name: 'Updated' })
        .expect(404);

      expect(res.body.errorCode).toBe('EVENT_NOT_FOUND');
    });

    it('returns 403 for USER role', async () => {
      const created = await prisma.historicalEvent.create({
        data: { name: 'E', slug: 'e' },
      });
      await request(app.getHttpServer())
        .patch(`/api/admin/events/${created.id}`)
        .set('Cookie', userCookie)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/admin/events/:id — Soft delete
  // ──────────────────────────────────────────────
  describe('DELETE /api/admin/events/:id', () => {
    it('admin can soft-delete an event (sets status to INACTIVE)', async () => {
      const created = await prisma.historicalEvent.create({
        data: { name: 'To Delete', slug: 'to-delete-event' },
      });

      await request(app.getHttpServer())
        .delete(`/api/admin/events/${created.id}`)
        .set('Cookie', adminCookie)
        .expect(204);

      // Record still exists but is INACTIVE
      const found = await prisma.historicalEvent.findUnique({
        where: { id: created.id },
      });
      expect(found).not.toBeNull();
      expect(found!.status).toBe('INACTIVE');
    });

    it('returns 404 when deleting non-existent event', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/admin/events/no-such-id')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body.errorCode).toBe('EVENT_NOT_FOUND');
    });

    it('returns 403 for USER role', async () => {
      const created = await prisma.historicalEvent.create({
        data: { name: 'Protected', slug: 'protected-event' },
      });
      await request(app.getHttpServer())
        .delete(`/api/admin/events/${created.id}`)
        .set('Cookie', userCookie)
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/events — Public list (ACTIVE only)
  // ──────────────────────────────────────────────
  describe('GET /api/events (public)', () => {
    beforeEach(async () => {
      await prisma.historicalEvent.createMany({
        data: [
          { name: 'Active One', slug: 'active-one-event', status: 'ACTIVE' },
          { name: 'Active Two', slug: 'active-two-event', status: 'ACTIVE' },
          { name: 'Hidden Event', slug: 'hidden-event', status: 'INACTIVE' },
        ],
      });
    });

    it('returns only ACTIVE events without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/events')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(
        res.body.data.items.every((e: { status: string }) => e.status === 'ACTIVE'),
      ).toBe(true);
    });

    it('does not require authentication', async () => {
      await request(app.getHttpServer()).get('/api/events').expect(200);
    });

    it('supports pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/events?page=1&pageSize=1')
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.totalPages).toBe(2);
    });

    it('supports search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/events?search=One')
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Active One');
    });

    it('never exposes INACTIVE events in public endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/events?status=INACTIVE')
        .expect(200);

      expect(
        res.body.data.items.every((e: { status: string }) => e.status === 'ACTIVE'),
      ).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/events/:slug — Public single
  // ──────────────────────────────────────────────
  describe('GET /api/events/:slug (public)', () => {
    it('returns an active event by slug', async () => {
      await prisma.historicalEvent.create({
        data: { name: 'Khởi nghĩa Lam Sơn', slug: 'khoi-nghia-lam-son', status: 'ACTIVE' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/events/khoi-nghia-lam-son')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('khoi-nghia-lam-son');
    });

    it('returns 404 for inactive event', async () => {
      await prisma.historicalEvent.create({
        data: { name: 'Inactive Event', slug: 'inactive-event-slug', status: 'INACTIVE' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/events/inactive-event-slug')
        .expect(404);

      expect(res.body.errorCode).toBe('EVENT_NOT_FOUND');
    });

    it('returns 404 for non-existent slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/events/does-not-exist')
        .expect(404);

      expect(res.body.errorCode).toBe('EVENT_NOT_FOUND');
    });
  });
});
