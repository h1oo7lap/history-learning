/**
 * Test helpers for e2e integration tests.
 * Creates a full NestJS app instance connected to the test database.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../src/common/interceptors/response-envelope.interceptor';
import { EMBEDDING_PROVIDER } from '../src/ai/embedding.provider';
import { FakeEmbeddingProvider } from '../src/ai/fake-embedding.provider';
import { LessonIndexingService } from '../src/ai/lesson-indexing.service';

function getDatabaseName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, '');
  } catch {
    return 'unknown_test_db';
  }
}

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

  const testDbUrl = process.env['TEST_DATABASE_URL'];
  const dbName = getDatabaseName(testDbUrl);

  // Strict safety check: Ensure the database name explicitly contains 'test'
  if (!dbName.toLowerCase().includes('test')) {
    throw new Error(
      `[test/setup] FATAL: TEST_DATABASE_URL points to "${dbName}", which does NOT contain "test"! ` +
        'Refusing to run tests against non-test database.',
    );
  }

  // Override DATABASE_URL to TEST_DATABASE_URL
  process.env['DATABASE_URL'] = testDbUrl;

  const currentDb = getDatabaseName(process.env['DATABASE_URL'] || '');
  if (!currentDb.toLowerCase().includes('test')) {
    throw new Error(
      `[test/setup] FATAL: DATABASE_URL points to "${currentDb}", which does NOT contain "test"! ` +
        'Refusing to run tests against non-test database.',
    );
  }

  console.log(`[Test DB] Connected to: ${dbName}`);

  // Safety rule: Always override EMBEDDING_PROVIDER with FakeEmbeddingProvider for tests
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EMBEDDING_PROVIDER)
    .useClass(FakeEmbeddingProvider)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  // Mirror main.ts global setup so AppError and envelope behave the same in tests
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  await app.init();

  const indexingService = app.get(LessonIndexingService, { strict: false });
  if (indexingService) {
    indexingService.isAutoIndexDisabled = true;
  }

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

/** Truncate user-related tables between tests */
export async function clearAuthTables(prisma: PrismaService) {
  await prisma.$executeRaw`TRUNCATE TABLE password_reset_tokens, users CASCADE`;
}

/** Truncate AI lesson chunks between tests */
export async function clearAiTables(prisma: PrismaService) {
  await prisma.$executeRaw`TRUNCATE TABLE lesson_chunks CASCADE`;
}
