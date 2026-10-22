import dotenv from 'dotenv';
dotenv.config();

import fs from 'node:fs';
import path from 'node:path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GeminiEmbeddingProvider } from '../gemini-embedding.provider';
import { EmbeddingDiskCache } from '../embedding-cache';
import { resolveEffectiveQuery } from '../retrieval';

interface EvalQuestion {
  id: string;
  category: 'in-scope' | 'out-of-scope' | 'follow-up' | 'adversarial';
  question: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  expectedBehavior: 'accept' | 'reject';
  expectedLessonSlug?: string;
}

interface EvalResult {
  id: string;
  category: string;
  question: string;
  effectiveQuery: string;
  expectedBehavior: 'accept' | 'reject';
  expectedLessonSlug?: string;
  topScore: number;
  topLessonSlug: string | null;
  topLessonTitle: string | null;
  isPublishedInDb: boolean;
}

async function main() {
  console.log('=== History Learning — AI Search / RAG Threshold Evaluation (ai:eval) ===\n');

  const config = new ConfigService();
  const prisma = new PrismaService(config);
  await prisma.$connect();

  try {
    const embeddingProvider = new GeminiEmbeddingProvider(config);
    const diskCache = new EmbeddingDiskCache();
    const dimensions = 768;
    const model = config.get<string>('AI_EMBEDDING_MODEL')?.trim() || 'gemini-embedding-2';
    const providerName = 'GeminiEmbeddingProvider';

    // 1. Load published lessons from DB
    const publishedLessons = await prisma.lesson.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, slug: true, title: true },
    });
    const publishedSlugs = new Set(publishedLessons.map((l) => l.slug));
    console.log(`[Database] Published lessons count in DB: ${publishedLessons.length}`);
    for (const l of publishedLessons) {
      console.log(`  - ${l.slug} (${l.title})`);
    }

    const chunkCount = await prisma.lessonChunk.count();
    console.log(`[Database] Total chunks in lesson_chunks: ${chunkCount}\n`);

    // Helper to embed with disk cache
    async function embedQueryCached(text: string): Promise<number[]> {
      const cached = diskCache.get(providerName, model, dimensions, text);
      if (cached && cached.length === dimensions) {
        return cached;
      }
      const vec = await embeddingProvider.embedQuery(text);
      diskCache.set(providerName, model, dimensions, text, vec);
      return vec;
    }

    // Helper to evaluate a list of questions
    async function evaluateSet(questions: EvalQuestion[]): Promise<EvalResult[]> {
      const results: EvalResult[] = [];

      for (const q of questions) {
        const effectiveQuery = resolveEffectiveQuery(q.question, q.history);
        const queryVec = await embedQueryCached(effectiveQuery);
        const vectorStr = `[${queryVec.join(',')}]`;

        const topRows = await prisma.$queryRaw<any[]>`
          SELECT
            l.slug,
            l.title,
            (1 - (lc.embedding <=> ${vectorStr}::vector)) AS score
          FROM lesson_chunks lc
          JOIN lessons l ON lc."lessonId" = l.id
          WHERE l.status = 'PUBLISHED'
          ORDER BY lc.embedding <=> ${vectorStr}::vector ASC
          LIMIT 1
        `;

        const top = topRows[0];
        const isPublished = q.expectedLessonSlug ? publishedSlugs.has(q.expectedLessonSlug) : false;

        results.push({
          id: q.id,
          category: q.category,
          question: q.question,
          effectiveQuery,
          expectedBehavior: q.expectedBehavior,
          expectedLessonSlug: q.expectedLessonSlug,
          topScore: top ? Number(top.score) : 0,
          topLessonSlug: top ? top.slug : null,
          topLessonTitle: top ? top.title : null,
          isPublishedInDb: isPublished,
        });
      }

      return results;
    }

    // 2. Load evaluation datasets
    const devPath = path.resolve(__dirname, '../../../test/ai/eval-questions.json');
    const holdoutPath = path.resolve(__dirname, '../../../test/ai/eval-holdout.json');

    const devQuestions: EvalQuestion[] = JSON.parse(fs.readFileSync(devPath, 'utf-8'));
    const holdoutQuestions: EvalQuestion[] = JSON.parse(fs.readFileSync(holdoutPath, 'utf-8'));

    console.log(`[Dataset] Loaded ${devQuestions.length} dev questions from eval-questions.json`);
    console.log(`[Dataset] Loaded ${holdoutQuestions.length} holdout questions from eval-holdout.json\n`);

    // 3. Run Dev Set
    console.log('Evaluating Dev Set (eval-questions.json)...');
    const devResults = await evaluateSet(devQuestions);

    // Filter dev results
    // In-scope with published lessons in DB:
    const devInScopePublished = devResults.filter(
      (r) => r.expectedBehavior === 'accept' && r.isPublishedInDb,
    );
    const devInScopeUnpublished = devResults.filter(
      (r) => r.expectedBehavior === 'accept' && !r.isPublishedInDb,
    );
    // Non-history / out-of-scope / reject questions:
    const devOutScope = devResults.filter((r) => r.expectedBehavior === 'reject');

    console.log('\n--- Dev Set In-Scope (Published in DB) ---');
    for (const r of devInScopePublished) {
      console.log(`  [${r.id}] Score: ${r.topScore.toFixed(4)} | Query: "${r.question}" -> Match: ${r.topLessonSlug}`);
    }

    console.log('\n--- Dev Set In-Scope (Unpublished / Missing from DB) ---');
    console.log(`  Count: ${devInScopeUnpublished.length} questions (excluded from positive threshold calculation)`);
    for (const r of devInScopeUnpublished) {
      console.log(`  [${r.id}] Score: ${r.topScore.toFixed(4)} | Expected: ${r.expectedLessonSlug} (NOT IN DB)`);
    }

    console.log('\n--- Dev Set Out-of-Scope / Rejection Questions ---');
    for (const r of devOutScope) {
      console.log(`  [${r.id}] Score: ${r.topScore.toFixed(4)} | Query: "${r.question}" -> Closest: ${r.topLessonSlug || 'none'}`);
    }

    // Calculate boundary scores
    const minInScopeScore =
      devInScopePublished.length > 0
        ? Math.min(...devInScopePublished.map((r) => r.topScore))
        : 0.80; // fallback if no published lessons in test set
    const maxOutScopeScore =
      devOutScope.length > 0
        ? Math.max(...devOutScope.map((r) => r.topScore))
        : 0.50;

    const gap = minInScopeScore - maxOutScopeScore;
    const recommendedThreshold = Number(((minInScopeScore + maxOutScopeScore) / 2).toFixed(4));

    console.log('\n================ Dev Set Threshold Analysis ================');
    console.log(`Lowest Top-1 Score for Valid In-Scope (Published): ${minInScopeScore.toFixed(4)}`);
    console.log(`Highest Top-1 Score for Out-of-Scope / Non-History: ${maxOutScopeScore.toFixed(4)}`);
    console.log(`Separation Gap (Min In - Max Out):                   ${gap.toFixed(4)}`);
    console.log(`Recommended Threshold (Midpoint):                  ${recommendedThreshold.toFixed(4)}`);
    console.log('============================================================\n');

    // 4. Run Holdout Set
    console.log('Evaluating Holdout Set (eval-holdout.json) with Recommended Threshold...');
    const holdoutResults = await evaluateSet(holdoutQuestions);

    const holdoutInScopePublished = holdoutResults.filter(
      (r) => r.expectedBehavior === 'accept' && r.isPublishedInDb,
    );
    const holdoutInScopeUnpublished = holdoutResults.filter(
      (r) => r.expectedBehavior === 'accept' && !r.isPublishedInDb,
    );
    const holdoutOutScope = holdoutResults.filter((r) => r.expectedBehavior === 'reject');

    let holdoutTrueAccepts = 0;
    let holdoutFalseRejects = 0;
    for (const r of holdoutInScopePublished) {
      if (r.topScore >= recommendedThreshold) {
        holdoutTrueAccepts++;
      } else {
        holdoutFalseRejects++;
      }
    }

    let holdoutTrueRejects = 0;
    let holdoutFalseAccepts = 0;
    for (const r of holdoutOutScope) {
      if (r.topScore < recommendedThreshold) {
        holdoutTrueRejects++;
      } else {
        holdoutFalseAccepts++;
      }
    }

    console.log('\n================ Holdout Set Evaluation ================');
    console.log(`Threshold applied:                                  ${recommendedThreshold.toFixed(4)}`);
    console.log(`Published in-scope questions:                       ${holdoutInScopePublished.length}`);
    console.log(`  - True Accepts (score >= threshold):             ${holdoutTrueAccepts}`);
    console.log(`  - False Rejects (score < threshold):             ${holdoutFalseRejects}`);
    console.log(`Unpublished / missing lesson questions:             ${holdoutInScopeUnpublished.length} (excluded from recall metric)`);
    console.log(`Out-of-scope / rejection questions:                 ${holdoutOutScope.length}`);
    console.log(`  - True Rejects (score < threshold):              ${holdoutTrueRejects}`);
    console.log(`  - False Accepts (score >= threshold):            ${holdoutFalseAccepts}`);

    const evaluatableCount = holdoutInScopePublished.length + holdoutOutScope.length;
    const correctCount = holdoutTrueAccepts + holdoutTrueRejects;
    const accuracy = evaluatableCount > 0 ? ((correctCount / evaluatableCount) * 100).toFixed(1) : 'N/A';

    console.log(`Overall Accuracy on evaluatable questions:          ${accuracy}% (${correctCount}/${evaluatableCount})`);
    console.log('========================================================\n');
    console.log('Note: Evaluation conclusions on database with limited PUBLISHED lessons');
    console.log('are indicative references. Full production evaluation should be conducted');
    console.log('after running "pnpm db:seed" and "pnpm --filter api ai:reindex".');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[ai:eval error]:', err?.message || err);
  process.exit(1);
});
