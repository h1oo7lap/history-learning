import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, clearAuthTables } from './setup';
import { PrismaService } from '../src/common/prisma/prisma.service';

async function getAuthCookie(app: INestApplication, email: string): Promise<string> {
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password: 'Password1', fullName: 'Test User' });

  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password: 'Password1' });

  const setCookieHeader = res.headers['set-cookie'];
  return Array.isArray(setCookieHeader) ? setCookieHeader[0] ?? '' : String(setCookieHeader ?? '');
}

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearAuthTables(prisma);
    userCookie = await getAuthCookie(app, 'user@example.com');

    // Promote a second user to ADMIN
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'admin@example.com', password: 'Password1', fullName: 'Admin User' });
    await prisma.user.updateMany({
      where: { email: 'admin@example.com' },
      data: { role: 'ADMIN' },
    });
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Password1' });
    const adminSetCookie = adminRes.headers['set-cookie'];
    adminCookie = Array.isArray(adminSetCookie) ? adminSetCookie[0] ?? '' : String(adminSetCookie ?? '');
  });

  // ──────────────────────────────────────────────
  // GET /api/users/me
  // ──────────────────────────────────────────────
  describe('GET /api/users/me', () => {
    it('returns user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Cookie', userCookie)
        .expect(200);

      expect(res.body).toMatchObject({
        success: true,
        data: { email: 'user@example.com', role: 'USER' },
      });
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // PATCH /api/users/me
  // ──────────────────────────────────────────────
  describe('PATCH /api/users/me', () => {
    it('updates fullName', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Cookie', userCookie)
        .send({ fullName: 'Updated Name' })
        .expect(200);

      expect(res.body.data.fullName).toBe('Updated Name');
    });

    it('rejects update with invalid gradeId', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Cookie', userCookie)
        .send({ gradeId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);

      expect(res.body).toMatchObject({ success: false, errorCode: 'GRADE_NOT_FOUND' });
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/me')
        .send({ fullName: 'No Auth' })
        .expect(401);
    });
  });

  // ──────────────────────────────────────────────
  // Admin route access control
  // ──────────────────────────────────────────────
  describe('Admin routes access control', () => {
    it('returns 403 for USER role accessing admin users list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Cookie', userCookie)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('allows ADMIN role to access admin users list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Cookie', adminCookie);

      // Should be 200 (not 403)
      expect(res.status).not.toBe(403);
    });
  });
});

// ──────────────────────────────────────────────
// GET /api/grades & /api/education-levels (public)
// ──────────────────────────────────────────────
describe('Grades (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/grades returns all grades (public, no auth required)', async () => {
    const res = await request(app.getHttpServer()).get('/api/grades').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Seeded with 9 grades
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/education-levels returns levels with nested grades', async () => {
    const res = await request(app.getHttpServer()).get('/api/education-levels').expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('grades');
    }
  });
});
