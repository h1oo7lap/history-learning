/**
 * Test helpers for e2e integration tests.
 * Creates a full NestJS app instance connected to the test database.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';

export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  // Safety guard: refuse to run if TEST_DATABASE_URL is not configured.
  // This prevents accidentally truncating the main (dev) database.
  if (!process.env['TEST_DATABASE_URL']) {
    throw new Error(
      '[test/setup] TEST_DATABASE_URL is not set. ' +
        'Add it to your .env file (e.g. postgresql://history:history@localhost:5432/history_learning_test?schema=public). ' +
        'Aborting to protect the main database.',
    );
  }

  // Override DATABASE_URL to TEST_DATABASE_URL if set
  process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL'];

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  // Mirror main.ts global setup so AppError and envelope behave the same in tests
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

/** Truncate user-related tables between tests */
export async function clearAuthTables(prisma: PrismaService) {
  await prisma.$executeRaw`TRUNCATE TABLE password_reset_tokens, users CASCADE`;
}
