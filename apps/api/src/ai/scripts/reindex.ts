import dotenv from 'dotenv';
dotenv.config();

import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GeminiEmbeddingProvider } from '../gemini-embedding.provider';
import { LessonIndexingService } from '../lesson-indexing.service';

async function main() {
  console.log('=== History Learning — AI Lesson Reindexing Script ===');

  const config = new ConfigService();
  const prisma = new PrismaService(config);
  await prisma.$connect();

  try {
    const embeddingProvider = new GeminiEmbeddingProvider(config);
    const indexingService = new LessonIndexingService(prisma, embeddingProvider, config);

    console.log('Starting full reindex of lessons in database...');
    const startTime = Date.now();

    const stats = await indexingService.reindexAll();
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n--- Reindex Summary ---');
    console.log(`Total lessons in DB:      ${stats.totalLessons}`);
    console.log(`PUBLISHED lessons:        ${stats.publishedLessons}`);
    console.log(`Total active chunks:      ${stats.totalChunks}`);
    console.log(`New / updated chunks:     ${stats.newChunks}`);
    console.log(`Skipped (unchanged):      ${stats.skippedChunks}`);
    console.log(`Errors encountered:       ${stats.errors}`);
    console.log(`Completed in:             ${durationSec}s`);
    console.log('------------------------');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // Do not print API key or secret values
  console.error('[Reindex Script Failed]:', err?.message || 'unknown error');
  process.exit(1);
});
