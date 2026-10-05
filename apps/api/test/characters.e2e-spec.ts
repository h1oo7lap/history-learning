import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAdminCookie(app: INestApplication, prisma: PrismaService) {
  const email = 'admin-chars@example.com';
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1', fullName: 'Admin Chars' });

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
  const email = 'user-chars@example.com';
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

describe('Characters (e2e)', () => {
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
    await prisma.$executeRaw`TRUNCATE TABLE historical_characters CASCADE`;
    await clearAuthTables(prisma);
    adminCookie = await getAdminCookie(app, prisma);
    userCookie = await getUserCookie(app);
  });

  // ──────────────────────────────────────────────
  // POST /api/admin/characters — Create
  // ──────────────────────────────────────────────
  describe('POST /api/admin/characters', () => {
    it('admin can create a character', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/characters')
        .set('Cookie', adminCookie)
        .send({
          name: 'Trần Hưng Đạo',
          shortDescription: 'Đại tướng quân nhà Trần',
          birthYear: 1228,
          deathYear: 1300,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        name: 'Trần Hưng Đạo',
        slug: 'tran-hung-dao',
        status: 'ACTIVE',
        shortDescription: 'Đại tướng quân nhà Trần',
        birthYear: 1228,
        deathYear: 1300,
      });
      expect(res.body.data).toHaveProperty('id');
    });

    it('auto-generates a unique slug when same name is used twice', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/characters')
        .set('Cookie', adminCookie)
        .send({ name: 'Character A' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/admin/characters')
        .set('Cookie', adminCookie)
        .send({ name: 'Character A' })
        .expect(201);

      expect(res.body.data.slug).toBe('character-a-1');
    });

    it('uses provided slug when given', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/characters')
        .set('Cookie', adminCookie)
        .send({ name: 'My Character', slug: 'custom-char-slug' })
        .expect(201);

      expect(res.body.data.slug).toBe('custom-char-slug');
    });

    it('creates character without birthYear/deathYear (nullable)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/characters')
        .set('Cookie', adminCookie)
        .send({ name: 'Unknown Dates' })
        .expect(201);

      expect(res.body.data.birthYear).toBeNull();
      expect(res.body.data.deathYear).toBeNull();
    });

    it('returns 403 for USER role', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/characters')
        .set('Cookie', userCookie)
        .send({ name: 'Unauthorized' })
        .expect(403);
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/characters')
        .send({ name: 'No auth' })
        .expect(401);
    });

    it('returns 400 for invalid body (name too short)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/characters')
        .set('Cookie', adminCookie)
        .send({ name: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/characters — Admin list
  // ──────────────────────────────────────────────
  describe('GET /api/admin/characters', () => {
    beforeEach(async () => {
      await prisma.historicalCharacter.createMany({
        data: [
          { name: 'Alpha Char', slug: 'alpha-char', status: 'ACTIVE' },
          { name: 'Beta Char', slug: 'beta-char', status: 'ACTIVE' },
          { name: 'Gamma Char', slug: 'gamma-char', status: 'INACTIVE' },
        ],
      });
    });

    it('admin sees all characters regardless of status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/characters')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.items).toHaveLength(3);
    });

    it('admin can filter by status=INACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/characters?status=INACTIVE')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].slug).toBe('gamma-char');
    });

    it('admin can search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/characters?search=lpha')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Alpha Char');
    });

    it('pagination metadata is correct', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/characters?page=1&pageSize=2')
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
        .get('/api/admin/characters')
        .set('Cookie', userCookie)
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/characters/:id
  // ──────────────────────────────────────────────
  describe('GET /api/admin/characters/:id', () => {
    it('admin can get character by ID', async () => {
      const created = await prisma.historicalCharacter.create({
        data: { name: 'Test Char', slug: 'test-char', birthYear: 1000, deathYear: 1060 },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/admin/characters/${created.id}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(res.body.data.id).toBe(created.id);
      expect(res.body.data.name).toBe('Test Char');
      expect(res.body.data.birthYear).toBe(1000);
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/characters/non-existent-id')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body).toMatchObject({
        success: false,
        errorCode: 'CHARACTER_NOT_FOUND',
      });
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /api/admin/characters/:id — Update
  // ──────────────────────────────────────────────
  describe('PATCH /api/admin/characters/:id', () => {
    it('admin can update character name and status', async () => {
      const created = await prisma.historicalCharacter.create({
        data: { name: 'Old Char', slug: 'old-char' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/characters/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'New Char', status: 'INACTIVE' })
        .expect(200);

      expect(res.body.data.name).toBe('New Char');
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('admin can update birthYear and deathYear', async () => {
      const created = await prisma.historicalCharacter.create({
        data: { name: 'Year Char', slug: 'year-char' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/characters/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ birthYear: 980, deathYear: 1040 })
        .expect(200);

      expect(res.body.data.birthYear).toBe(980);
      expect(res.body.data.deathYear).toBe(1040);
    });

    it('admin can update biography and shortDescription', async () => {
      const created = await prisma.historicalCharacter.create({
        data: { name: 'Bio Char', slug: 'bio-char' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/characters/${created.id}`)
        .set('Cookie', adminCookie)
        .send({
          shortDescription: 'A brave warrior',
          biography: 'Full biography text here.',
        })
        .expect(200);

      expect(res.body.data.shortDescription).toBe('A brave warrior');
      expect(res.body.data.biography).toBe('Full biography text here.');
    });

    it('regenerates slug automatically when name changes without explicit slug', async () => {
      const created = await prisma.historicalCharacter.create({
        data: { name: 'Original Char', slug: 'original-char' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/characters/${created.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'Renamed Char' })
        .expect(200);

      expect(res.body.data.slug).toBe('renamed-char');
    });

    it('returns 409 when explicit slug conflicts with another character', async () => {
      await prisma.historicalCharacter.create({ data: { name: 'First', slug: 'first-char' } });
      const second = await prisma.historicalCharacter.create({
        data: { name: 'Second', slug: 'second-char' },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/admin/characters/${second.id}`)
        .set('Cookie', adminCookie)
        .send({ slug: 'first-char' })
        .expect(409);

      expect(res.body.errorCode).toBe('SLUG_TAKEN');
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/admin/characters/bad-id')
        .set('Cookie', adminCookie)
        .send({ name: 'Updated' })
        .expect(404);

      expect(res.body.errorCode).toBe('CHARACTER_NOT_FOUND');
    });

    it('returns 403 for USER role', async () => {
      const created = await prisma.historicalCharacter.create({
        data: { name: 'C', slug: 'c' },
      });
      await request(app.getHttpServer())
        .patch(`/api/admin/characters/${created.id}`)
        .set('Cookie', userCookie)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/admin/characters/:id — Soft delete
  // ──────────────────────────────────────────────
  describe('DELETE /api/admin/characters/:id', () => {
    it('admin can soft-delete a character (sets status to INACTIVE)', async () => {
      const created = await prisma.historicalCharacter.create({
        data: { name: 'To Delete', slug: 'to-delete-char' },
      });

      await request(app.getHttpServer())
        .delete(`/api/admin/characters/${created.id}`)
        .set('Cookie', adminCookie)
        .expect(204);

      // Record still exists but is INACTIVE
      const found = await prisma.historicalCharacter.findUnique({
        where: { id: created.id },
      });
      expect(found).not.toBeNull();
      expect(found!.status).toBe('INACTIVE');
    });

    it('returns 404 when deleting non-existent character', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/admin/characters/no-such-id')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(res.body.errorCode).toBe('CHARACTER_NOT_FOUND');
    });

    it('returns 403 for USER role', async () => {
      const created = await prisma.historicalCharacter.create({
        data: { name: 'Protected', slug: 'protected-char' },
      });
      await request(app.getHttpServer())
        .delete(`/api/admin/characters/${created.id}`)
        .set('Cookie', userCookie)
        .expect(403);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/characters — Public list (ACTIVE only)
  // ──────────────────────────────────────────────
  describe('GET /api/characters (public)', () => {
    beforeEach(async () => {
      await prisma.historicalCharacter.createMany({
        data: [
          { name: 'Active One', slug: 'active-one-char', status: 'ACTIVE' },
          { name: 'Active Two', slug: 'active-two-char', status: 'ACTIVE' },
          { name: 'Hidden Char', slug: 'hidden-char', status: 'INACTIVE' },
        ],
      });
    });

    it('returns only ACTIVE characters without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/characters')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(
        res.body.data.items.every((c: { status: string }) => c.status === 'ACTIVE'),
      ).toBe(true);
    });

    it('does not require authentication', async () => {
      await request(app.getHttpServer()).get('/api/characters').expect(200);
    });

    it('supports pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/characters?page=1&pageSize=1')
        .expect(200);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.totalPages).toBe(2);
    });

    it('supports search by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/characters?search=One')
        .expect(200);

      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].name).toBe('Active One');
    });

    it('never exposes INACTIVE characters in public endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/characters?status=INACTIVE')
        .expect(200);

      expect(
        res.body.data.items.every((c: { status: string }) => c.status === 'ACTIVE'),
      ).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/characters/:slug — Public single
  // ──────────────────────────────────────────────
  describe('GET /api/characters/:slug (public)', () => {
    it('returns an active character by slug', async () => {
      await prisma.historicalCharacter.create({
        data: { name: 'Lý Thường Kiệt', slug: 'ly-thuong-kiet', status: 'ACTIVE' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/characters/ly-thuong-kiet')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('ly-thuong-kiet');
    });

    it('returns 404 for inactive character', async () => {
      await prisma.historicalCharacter.create({
        data: { name: 'Inactive Char', slug: 'inactive-char-slug', status: 'INACTIVE' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/characters/inactive-char-slug')
        .expect(404);

      expect(res.body.errorCode).toBe('CHARACTER_NOT_FOUND');
    });

    it('returns 404 for non-existent slug', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/characters/does-not-exist')
        .expect(404);

      expect(res.body.errorCode).toBe('CHARACTER_NOT_FOUND');
    });
  });
});
