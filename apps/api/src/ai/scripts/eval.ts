// =============================================================================
// LƯU Ý QUAN TRỌNG:
// Bộ eval-holdout.json KHÔNG độc lập (được tạo trước khi tinh chỉnh RAG).
// Để kiểm tra độ bền thực tế sau tinh chỉnh, sử dụng:
//   pnpm ai:eval --file test/ai/eval-robustness.json
// =============================================================================

import dotenv from 'dotenv';
dotenv.config();

import fs from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { GeminiEmbeddingProvider } from '../gemini-embedding.provider';
import { EmbeddingDiskCache } from '../embedding-cache';
import { chunkLesson, type LessonChunkInput, type LessonChunkResult } from '../chunker';
import { resolveEffectiveQuery } from '../retrieval';
import {
  DEFAULT_PACING_MS,
  sleep,
  withRateLimitRetry,
  isApiError,
} from './eval-retry-helper';

interface SeedLessonJson {
  title: string;
  slug: string;
  summary?: string;
  status: string;
  blocks?: Array<{ id: string; type: string; text?: string }>;
  characters?: Array<{ name?: string; slug?: string; role?: string }>;
  events?: Array<string | { name?: string; slug?: string }>;
}

interface LoadedChunk {
  lessonSlug: string;
  lessonTitle: string;
  chunkIndex: number;
  heading?: string;
  embedText: string;
  embedding: number[];
}

interface EvalQuestion {
  id: string;
  category: string;
  question: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  expectedBehavior: 'accept' | 'reject';
  expectedLessonSlug?: string;
}

type QuestionGroup = 'in-scope' | 'lịch sử ngoài kho' | 'phi lịch sử';

interface EvaluatedQuestionResult {
  id: string;
  group: QuestionGroup;
  question: string;
  effectiveQuery: string;
  expectedBehavior: 'accept' | 'reject';
  expectedLessonSlug?: string;
  topScore: number;
  topLessonSlug: string;
  topLessonTitle: string;
  isCorrectLesson: boolean;
  isApiError?: boolean;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function classifyQuestion(
  q: EvalQuestion,
  isHoldout: boolean,
  publishedSlugs: Set<string>,
): QuestionGroup {
  if (q.expectedBehavior === 'accept') {
    if (q.expectedLessonSlug && publishedSlugs.has(q.expectedLessonSlug)) {
      return 'in-scope';
    }
    // Expected lesson is DRAFT or ARCHIVED (not in published seed catalog)
    return 'lịch sử ngoài kho';
  }

  // q.expectedBehavior === 'reject'
  if (isHoldout) {
    if (q.category === 'out-of-scope-b') {
      return 'lịch sử ngoài kho';
    }
    return 'phi lịch sử';
  }

  // Dev set categorization
  const outHistoryIds = new Set(['eval-out-06', 'eval-out-08', 'eval-trap-03', 'eval-trap-08']);
  if (outHistoryIds.has(q.id)) {
    return 'lịch sử ngoài kho';
  }
  return 'phi lịch sử';
}

async function main() {
  console.log('================================================================================');
  console.log('=== History Learning — AI Search / RAG Threshold Evaluation (ai:eval)        ===');
  console.log('=== Chế độ: Nạp trực tiếp từ seed JSON, nhúng Gemini THẬT, tính in-memory    ===');
  console.log('================================================================================\n');

  const config = new ConfigService();
  const apiKey = config.get<string>('AI_API_KEY')?.trim() || config.get<string>('GEMINI_API_KEY')?.trim();
  const dimensions = 768;

  // 1. Kiểm tra nghiêm ngặt: Phải có Gemini Embedding Provider THẬT và API key
  if (!apiKey) {
    console.error('FATAL: Script ai:eval từ chối chạy vì thiếu AI_API_KEY / GEMINI_API_KEY.');
    console.error('ai:eval bắt buộc phải dùng GeminiEmbeddingProvider THẬT để đo đạc chính xác.');
    process.exit(1);
  }

  const embeddingProvider = new GeminiEmbeddingProvider(config);
  if (embeddingProvider.constructor.name !== 'GeminiEmbeddingProvider') {
    console.error('FATAL: Provider không phải GeminiEmbeddingProvider thật. Từ chối chạy.');
    process.exit(1);
  }

  const modelIdentifier = embeddingProvider.modelIdentifier;

  console.log(`[Provider] : ${embeddingProvider.constructor.name} (THẬT)`);
  console.log(`[Model]    : ${modelIdentifier}`);
  console.log(`[Dimensions]: ${dimensions}`);
  console.log(`[Disk Cache]: .cache/embeddings (sha256 keying có định danh provider + model)`);
  console.log(`[Giãn cách] : ~${(DEFAULT_PACING_MS / 1000).toFixed(1)}s giữa các request thật tới API\n`);

  const diskCache = new EmbeddingDiskCache();
  const providerName = 'GeminiEmbeddingProvider';

  async function getOrEmbed(text: string, isDoc: boolean): Promise<number[]> {
    const cached = diskCache.get(providerName, modelIdentifier, dimensions, text);
    if (cached && cached.length === dimensions) {
      return cached;
    }
    // Giãn cách mặc định ~4.5s giữa các request thật tới API
    await sleep(DEFAULT_PACING_MS);

    const vec = await withRateLimitRetry(
      async () => {
        return isDoc
          ? (await embeddingProvider.embedDocuments([text]))[0]!
          : await embeddingProvider.embedQuery(text);
      },
      { label: `Nhúng ${isDoc ? 'chunk bài học' : 'câu hỏi'}` },
    );

    diskCache.set(providerName, modelIdentifier, dimensions, text, vec);
    return vec;
  }

  // 2. Nạp các bài học từ apps/api/prisma/seed/lessons/*.json (chỉ status === 'PUBLISHED')
  const lessonsDir = path.resolve(__dirname, '../../../prisma/seed/lessons');
  const lessonFiles = fs.readdirSync(lessonsDir).filter((f) => f.endsWith('.json'));

  const publishedLessons: Array<{ slug: string; title: string; chunks: LessonChunkResult[] }> = [];
  const publishedSlugs = new Set<string>();

  console.log(`[Seed Catalog] Quét thư mục: ${lessonsDir}`);
  for (const file of lessonFiles) {
    const filePath = path.join(lessonsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lessonData: SeedLessonJson = JSON.parse(content);

    if (lessonData.status !== 'PUBLISHED') {
      console.log(`  - Bỏ qua: [${lessonData.status}] ${lessonData.slug}`);
      continue;
    }

    const chunkInput: LessonChunkInput = {
      id: lessonData.slug,
      title: lessonData.title,
      slug: lessonData.slug,
      contentJson: {
        blocks: lessonData.blocks || [],
      },
      characters: lessonData.characters?.map((c) => ({
        name: c.name || c.slug,
        slug: c.slug,
        role: c.role,
      })),
      events: lessonData.events?.map((e) => ({
        name: typeof e === 'string' ? e : e.name || e.slug,
        slug: typeof e === 'string' ? e : e.slug,
      })),
    };

    const chunks = chunkLesson(chunkInput);
    publishedLessons.push({
      slug: lessonData.slug,
      title: lessonData.title,
      chunks,
    });
    publishedSlugs.add(lessonData.slug);
    console.log(`  + Nạp PUBLISHED: ${lessonData.slug} (${chunks.length} chunks) - "${lessonData.title}"`);
  }

  console.log(`\nTổng số bài học PUBLISHED nạp được: ${publishedLessons.length}`);

  // 3. Nhúng tất cả chunks vào bộ nhớ
  console.log('\nĐang nhúng các chunks bài học qua cache...');
  const loadedChunks: LoadedChunk[] = [];
  for (const lesson of publishedLessons) {
    for (const chunk of lesson.chunks) {
      const embedding = await getOrEmbed(chunk.embedText, true);
      loadedChunks.push({
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        chunkIndex: chunk.chunkIndex,
        heading: chunk.heading,
        embedText: chunk.embedText,
        embedding,
      });
    }
  }
  console.log(`Tổng số chunks trong kho bộ nhớ: ${loadedChunks.length}\n`);

  // Hàm đánh giá một danh sách câu hỏi
  async function evaluateQuestions(
    questions: EvalQuestion[],
    isHoldout: boolean,
  ): Promise<EvaluatedQuestionResult[]> {
    const results: EvaluatedQuestionResult[] = [];

    for (const q of questions) {
      const group = classifyQuestion(q, isHoldout, publishedSlugs);
      const effectiveQuery = resolveEffectiveQuery(q.question, q.history);

      let queryVec: number[];
      try {
        queryVec = await getOrEmbed(effectiveQuery, false);
      } catch (err: any) {
        if (isApiError(err)) {
          console.warn(`[Lỗi API] Bỏ qua câu [${q.id}] do lỗi API (429/timeout): ${err?.message || err}`);
          results.push({
            id: q.id,
            group,
            question: q.question,
            effectiveQuery,
            expectedBehavior: q.expectedBehavior,
            expectedLessonSlug: q.expectedLessonSlug,
            topScore: -1,
            topLessonSlug: 'none',
            topLessonTitle: 'none',
            isCorrectLesson: false,
            isApiError: true,
          });
          continue;
        }
        throw err;
      }

      let topScore = -1;
      let topLessonSlug = 'none';
      let topLessonTitle = 'none';

      for (const chunk of loadedChunks) {
        const score = cosineSimilarity(queryVec, chunk.embedding);
        if (score > topScore) {
          topScore = score;
          topLessonSlug = chunk.lessonSlug;
          topLessonTitle = chunk.lessonTitle;
        }
      }

      const isCorrectLesson =
        q.expectedLessonSlug !== undefined && topLessonSlug === q.expectedLessonSlug;

      results.push({
        id: q.id,
        group,
        question: q.question,
        effectiveQuery,
        expectedBehavior: q.expectedBehavior,
        expectedLessonSlug: q.expectedLessonSlug,
        topScore,
        topLessonSlug,
        topLessonTitle,
        isCorrectLesson,
        isApiError: false,
      });
    }

    return results;
  }

  // Helper in bảng chi tiết từng câu hỏi
  function printQuestionTable(results: EvaluatedQuestionResult[]) {
    console.log(
      '| ID           | Nhóm                 | Top-1 Score | Top-1 Lesson Slug                     | Expected Slug                         | Kết quả |',
    );
    console.log(
      '|--------------|----------------------|-------------|---------------------------------------|---------------------------------------|---------|',
    );
    for (const r of results) {
      const idCol = r.id.padEnd(12);
      const groupCol = r.group.padEnd(20);
      const scoreCol = r.isApiError ? '   LỖI API' : r.topScore.toFixed(4).padStart(11);
      const topCol = r.topLessonSlug.slice(0, 37).padEnd(37);
      const expCol = (r.expectedLessonSlug || '-').slice(0, 37).padEnd(37);
      const matchCol = r.isApiError
        ? 'LỖI API '
        : r.group === 'in-scope'
          ? r.isCorrectLesson
            ? 'ĐÚNG BÀI'
            : 'SAI BÀI '
          : 'REJECT  ';
      console.log(`| ${idCol} | ${groupCol} | ${scoreCol} | ${topCol} | ${expCol} | ${matchCol}|`);
    }
  }

  // Helper quét ngưỡng
  function scanThresholds(results: EvaluatedQuestionResult[]) {
    const validResults = results.filter((r) => !r.isApiError);
    const apiErrors = results.filter((r) => r.isApiError);

    if (apiErrors.length > 0) {
      console.log(`[Lưu ý] Có ${apiErrors.length} câu gặp lỗi API (429/timeout) được tính riêng, không tính vào tỉ lệ.`);
    }

    const inScope = validResults.filter((r) => r.group === 'in-scope');
    const outHistory = validResults.filter((r) => r.group === 'lịch sử ngoài kho');
    const nonHistory = validResults.filter((r) => r.group === 'phi lịch sử');

    console.log(
      '| Ngưỡng | Nhận nhầm phi LS (<=0) | Nhận nhầm LS ngoài kho | Từ chối oan in-scope | Tìm đúng bài in-scope | Độ chính xác in-scope |',
    );
    console.log(
      '|--------|------------------------|------------------------|----------------------|-----------------------|-----------------------|',
    );

    const thresholds = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85];

    for (const t of thresholds) {
      const falseAcceptNonHistory = nonHistory.filter((r) => r.topScore >= t).length;
      const falseAcceptOutHistory = outHistory.filter((r) => r.topScore >= t).length;
      const falseRejectInScope = inScope.filter((r) => r.topScore < t).length;
      const trueAcceptCorrectLesson = inScope.filter((r) => r.topScore >= t && r.isCorrectLesson).length;
      const inScopeAccuracy =
        inScope.length > 0 ? `${((trueAcceptCorrectLesson / inScope.length) * 100).toFixed(1)}%` : 'N/A';

      const tStr = t.toFixed(2).padEnd(6);
      const faNonStr = `${falseAcceptNonHistory}/${nonHistory.length}`.padEnd(22);
      const faOutStr = `${falseAcceptOutHistory}/${outHistory.length}`.padEnd(22);
      const frInStr = `${falseRejectInScope}/${inScope.length}`.padEnd(20);
      const taCorrStr = `${trueAcceptCorrectLesson}/${inScope.length}`.padEnd(21);
      const accStr = inScopeAccuracy.padEnd(21);

      console.log(`| ${tStr} | ${faNonStr} | ${faOutStr} | ${frInStr} | ${taCorrStr} | ${accStr} |`);
    }
  }

  // Kiểm tra cờ --file hoặc argument đường dẫn file
  const args = process.argv.slice(2);
  let customFile: string | null = null;
  const fileFlagIdx = args.findIndex((a) => a === '--file' || a === '-f');
  if (fileFlagIdx !== -1 && args[fileFlagIdx + 1]) {
    customFile = args[fileFlagIdx + 1]!;
  } else {
    const candidate = args.find((a) => !a.startsWith('-') && a.endsWith('.json'));
    if (candidate) customFile = candidate;
  }

  const selectedThreshold = 0.65;

  if (customFile) {
    const resolvedPath = path.isAbsolute(customFile)
      ? customFile
      : path.resolve(process.cwd(), customFile);

    if (!fs.existsSync(resolvedPath)) {
      console.error(`FATAL: File không tồn tại: ${resolvedPath}`);
      process.exit(1);
    }

    console.log('================================================================================');
    console.log(`ĐÁNH GIÁ TẬP DỮ LIỆU TÙY CHỌN: ${path.basename(resolvedPath)}`);
    console.log(`Đường dẫn: ${resolvedPath}`);
    console.log(`Ngưỡng kiểm tra: ${selectedThreshold.toFixed(2)}`);
    console.log('================================================================================\n');

    interface CustomQuestionItem {
      id: string;
      type?: string;
      category?: string;
      group?: string;
      question: string;
      expectedLesson?: string;
      expectedLessonSlug?: string;
      expectRefusal?: boolean;
      expectedBehavior?: 'accept' | 'reject';
    }

    const rawItems: CustomQuestionItem[] = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    console.log(`Tổng số câu hỏi trong file: ${rawItems.length}\n`);

    interface EvaluatedCustomItem {
      id: string;
      groupName: string;
      question: string;
      expectedSlug?: string;
      expectRefusal: boolean;
      topScore: number;
      topLessonSlug: string;
      topLessonTitle: string;
      isCorrect: boolean;
      isApiError?: boolean;
      failureReason?: string;
    }

    const evaluatedList: EvaluatedCustomItem[] = [];

    for (const q of rawItems) {
      const groupName = q.type || q.group || q.category || 'Nhóm chung';
      const expectedSlug = q.expectedLesson || q.expectedLessonSlug;
      const expectRefusal = q.expectRefusal ?? (q.expectedBehavior === 'reject');

      const effectiveQuery = resolveEffectiveQuery(q.question);

      let queryVec: number[];
      try {
        queryVec = await getOrEmbed(effectiveQuery, false);
      } catch (err: any) {
        if (isApiError(err)) {
          evaluatedList.push({
            id: q.id,
            groupName,
            question: q.question,
            expectedSlug,
            expectRefusal,
            topScore: -1,
            topLessonSlug: 'none',
            topLessonTitle: 'none',
            isCorrect: false,
            isApiError: true,
            failureReason: `Lỗi API (429/timeout): ${err?.message || err}`,
          });
          continue;
        }
        throw err;
      }

      let topScore = -1;
      let topLessonSlug = 'none';
      let topLessonTitle = 'none';

      for (const chunk of loadedChunks) {
        const score = cosineSimilarity(queryVec, chunk.embedding);
        if (score > topScore) {
          topScore = score;
          topLessonSlug = chunk.lessonSlug;
          topLessonTitle = chunk.lessonTitle;
        }
      }

      let isCorrect = false;
      let failureReason: string | undefined;

      if (expectRefusal) {
        if (topScore < selectedThreshold) {
          isCorrect = true;
        } else {
          isCorrect = false;
          failureReason = `Nhận nhầm bài "${topLessonSlug}" (score ${topScore.toFixed(4)} >= ${selectedThreshold})`;
        }
      } else {
        if (topScore >= selectedThreshold && topLessonSlug === expectedSlug) {
          isCorrect = true;
        } else if (topScore < selectedThreshold) {
          isCorrect = false;
          failureReason = `Từ chối oan (score ${topScore.toFixed(4)} < ${selectedThreshold}, match "${topLessonSlug}", kỳ vọng "${expectedSlug}")`;
        } else {
          isCorrect = false;
          failureReason = `Sai bài học (score ${topScore.toFixed(4)}, match "${topLessonSlug}", kỳ vọng "${expectedSlug}")`;
        }
      }

      evaluatedList.push({
        id: q.id,
        groupName,
        question: q.question,
        expectedSlug,
        expectRefusal,
        topScore,
        topLessonSlug,
        topLessonTitle,
        isCorrect,
        isApiError: false,
        failureReason,
      });
    }

    // Nhóm kết quả theo groupName
    const groupsMap = new Map<string, EvaluatedCustomItem[]>();
    for (const item of evaluatedList) {
      if (!groupsMap.has(item.groupName)) {
        groupsMap.set(item.groupName, []);
      }
      groupsMap.get(item.groupName)!.push(item);
    }

    console.log('--------------------------------------------------------------------------------');
    console.log('KẾT QUẢ ĐÁNH GIÁ THEO TỪNG NHÓM:');
    console.log('--------------------------------------------------------------------------------\n');

    let totalCorrect = 0;

    for (const [groupName, items] of groupsMap.entries()) {
      const validItems = items.filter((i) => !i.isApiError);
      const apiErrorsInGroup = items.filter((i) => i.isApiError);
      const correctInGroup = validItems.filter((i) => i.isCorrect).length;
      totalCorrect += correctInGroup;
      const scores = validItems.map((i) => i.topScore);
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const accuracy = validItems.length > 0 ? ((correctInGroup / validItems.length) * 100).toFixed(1) : 'N/A';

      console.log(`▶ [${groupName}] : ${correctInGroup}/${validItems.length} câu đúng (${accuracy}%) ${apiErrorsInGroup.length > 0 ? `[${apiErrorsInGroup.length} lỗi API - tính riêng]` : ''}`);
      console.log(`   - Điểm thấp nhất : ${minScore.toFixed(4)} | Điểm cao nhất: ${maxScore.toFixed(4)}`);

      const failedItems = validItems.filter((i) => !i.isCorrect);
      if (failedItems.length > 0) {
        console.log(`   - Danh sách câu sai (${failedItems.length} câu):`);
        for (const fail of failedItems) {
          console.log(`     * [${fail.id}] "${fail.question}"`);
          console.log(`       -> Top score: ${fail.topScore.toFixed(4)} | Lý do: ${fail.failureReason}`);
        }
      } else {
        console.log('   - Danh sách câu sai: Không có (Đạt 100%)');
      }
      if (apiErrorsInGroup.length > 0) {
        console.log(`   - Danh sách câu lỗi API (${apiErrorsInGroup.length} câu):`);
        for (const errItem of apiErrorsInGroup) {
          console.log(`     * [${errItem.id}] "${errItem.question}" -> ${errItem.failureReason}`);
        }
      }
      console.log('');
    }

    const totalValid = evaluatedList.filter((i) => !i.isApiError).length;
    const totalApiErrors = evaluatedList.filter((i) => i.isApiError).length;

    console.log('================================================================================');
    console.log(`TỔNG KẾT BỘ EVALUATION: ${totalCorrect}/${totalValid} câu đúng (${totalValid > 0 ? ((totalCorrect / totalValid) * 100).toFixed(1) : 0}%)`);
    if (totalApiErrors > 0) {
      console.log(`LỖI API (429/timeout): ${totalApiErrors} câu (TÍNH RIÊNG, KHÔNG TÍNH VÀO TỈ LỆ ĐẠT/TRƯỢT)`);
    }
    console.log('================================================================================\n');
    return;
  }

  // 4. ĐÁNH GIÁ BỘ DEV (eval-questions.json)
  const devPath = path.resolve(__dirname, '../../../test/ai/eval-questions.json');
  const holdoutPath = path.resolve(__dirname, '../../../test/ai/eval-holdout.json');

  const devQuestions: EvalQuestion[] = JSON.parse(fs.readFileSync(devPath, 'utf-8'));
  const holdoutQuestions: EvalQuestion[] = JSON.parse(fs.readFileSync(holdoutPath, 'utf-8'));

  console.log('================================================================================');
  console.log(`PHẦN 1: ĐÁNH GIÁ BỘ DEV (${devQuestions.length} câu)`);
  console.log('================================================================================\n');

  const devResults = await evaluateQuestions(devQuestions, false);
  printQuestionTable(devResults);

  const devValid = devResults.filter((r) => !r.isApiError);
  const devInScope = devValid.filter((r) => r.group === 'in-scope');
  const devOutHistory = devValid.filter((r) => r.group === 'lịch sử ngoài kho');
  const devNonHistory = devValid.filter((r) => r.group === 'phi lịch sử');
  const devApiErrors = devResults.filter((r) => r.isApiError);

  console.log(`\nPhân bổ bộ Dev (${devValid.length} câu hợp lệ${devApiErrors.length > 0 ? `, ${devApiErrors.length} lỗi API tính riêng` : ''}):`);
  console.log(`  - in-scope            : ${devInScope.length} câu (kỳ vọng ~12 câu)`);
  console.log(`  - lịch sử ngoài kho   : ${devOutHistory.length} câu (gồm câu ngoài chương trình + 4 câu bài DRAFT/ARCHIVED)`);
  console.log(`  - phi lịch sử         : ${devNonHistory.length} câu`);

  const minDevInScope = devInScope.length > 0 ? Math.min(...devInScope.map((r) => r.topScore)) : 0;
  const maxDevNonHistory = devNonHistory.length > 0 ? Math.max(...devNonHistory.map((r) => r.topScore)) : 0;
  const maxDevOutHistory = devOutHistory.length > 0 ? Math.max(...devOutHistory.map((r) => r.topScore)) : 0;
  const devGap = minDevInScope - maxDevNonHistory;

  console.log('\n--- Thống kê điểm số bộ Dev ---');
  console.log(`  * Min điểm in-scope         : ${minDevInScope.toFixed(4)}`);
  console.log(`  * Max điểm phi lịch sử      : ${maxDevNonHistory.toFixed(4)}`);
  console.log(`  * Max điểm lịch sử ngoài kho: ${maxDevOutHistory.toFixed(4)}`);
  console.log(`  * Khoảng cách tách biệt (Min In - Max Phi LS): ${devGap.toFixed(4)}\n`);

  console.log('--- Quét ngưỡng trên bộ Dev ---');
  scanThresholds(devResults);

  console.log(`\n=> CHỌN NGƯỠNG TRÊN BỘ DEV: ${selectedThreshold.toFixed(2)}`);

  // 5. ĐÁNH GIÁ BỘ HOLDOUT (eval-holdout.json) VỚI NGƯỠNG ĐÃ CHỌN
  console.log('\n================================================================================');
  console.log(`PHẦN 2: ĐO TRÊN BỘ HOLDOUT (${holdoutQuestions.length} câu) VỚI NGƯỠNG ${selectedThreshold.toFixed(2)}`);
  console.log('================================================================================\n');

  const holdoutResults = await evaluateQuestions(holdoutQuestions, true);
  printQuestionTable(holdoutResults);

  const holdoutValid = holdoutResults.filter((r) => !r.isApiError);
  const holdoutInScope = holdoutValid.filter((r) => r.group === 'in-scope');
  const holdoutOutHistory = holdoutValid.filter((r) => r.group === 'lịch sử ngoài kho');
  const holdoutNonHistory = holdoutValid.filter((r) => r.group === 'phi lịch sử');
  const holdoutApiErrors = holdoutResults.filter((r) => r.isApiError);

  console.log(`\nPhân bổ bộ Hold-out (${holdoutValid.length} câu hợp lệ${holdoutApiErrors.length > 0 ? `, ${holdoutApiErrors.length} lỗi API tính riêng` : ''}):`);
  console.log(`  - in-scope            : ${holdoutInScope.length} câu (kỳ vọng ~7 câu)`);
  console.log(`  - lịch sử ngoài kho   : ${holdoutOutHistory.length} câu (gồm 5 câu ngoài kho + 3 câu bài DRAFT/ARCHIVED)`);
  console.log(`  - phi lịch sử         : ${holdoutNonHistory.length} câu`);

  const minHoldoutInScope = holdoutInScope.length > 0 ? Math.min(...holdoutInScope.map((r) => r.topScore)) : 0;
  const maxHoldoutNonHistory = holdoutNonHistory.length > 0 ? Math.max(...holdoutNonHistory.map((r) => r.topScore)) : 0;
  const maxHoldoutOutHistory = holdoutOutHistory.length > 0 ? Math.max(...holdoutOutHistory.map((r) => r.topScore)) : 0;
  const holdoutGap = minHoldoutInScope - maxHoldoutNonHistory;

  console.log('\n--- Thống kê điểm số bộ Hold-out ---');
  console.log(`  * Min điểm in-scope         : ${minHoldoutInScope.toFixed(4)}`);
  console.log(`  * Max điểm phi lịch sử      : ${maxHoldoutNonHistory.toFixed(4)}`);
  console.log(`  * Max điểm lịch sử ngoài kho: ${maxHoldoutOutHistory.toFixed(4)}`);
  console.log(`  * Khoảng cách tách biệt (Min In - Max Phi LS): ${holdoutGap.toFixed(4)}\n`);

  console.log('--- Quét ngưỡng trên bộ Hold-out ---');
  scanThresholds(holdoutResults);

  // Đánh giá hiệu năng tại selectedThreshold trên bộ holdout
  const holdoutFaNon = holdoutNonHistory.filter((r) => r.topScore >= selectedThreshold).length;
  const holdoutFaOut = holdoutOutHistory.filter((r) => r.topScore >= selectedThreshold).length;
  const holdoutFrIn = holdoutInScope.filter((r) => r.topScore < selectedThreshold).length;
  const holdoutTrueIn = holdoutInScope.filter((r) => r.topScore >= selectedThreshold && r.isCorrectLesson).length;

  console.log('\n================================================================================');
  console.log(`KẾT LUẬN ĐÁNH GIÁ TRÊN BỘ HOLDOUT TẠI NGƯỠNG ${selectedThreshold.toFixed(2)}:`);
  console.log(`  1. Nhận nhầm phi lịch sử       : ${holdoutFaNon}/${holdoutNonHistory.length} (${holdoutFaNon === 0 ? 'HOÀN HẢO 0%' : 'CẢNH BÁO'})`);
  console.log(`  2. Nhận nhầm lịch sử ngoài kho : ${holdoutFaOut}/${holdoutOutHistory.length}`);
  console.log(`  3. Từ chối oan câu in-scope    : ${holdoutFrIn}/${holdoutInScope.length}`);
  if (holdoutInScope.length > 0) {
    console.log(`  4. Tìm đúng bài học in-scope   : ${holdoutTrueIn}/${holdoutInScope.length} (${((holdoutTrueIn / holdoutInScope.length) * 100).toFixed(1)}%)`);
  }
  if (holdoutApiErrors.length > 0) {
    console.log(`  5. Lỗi API (429/timeout)       : ${holdoutApiErrors.length} câu (TÍNH RIÊNG, KHÔNG TÍNH VÀO TỈ LỆ)`);
  }
  console.log('================================================================================\n');
}

main().catch((err) => {
  console.error('[ai:eval error]:', err?.message || err);
  process.exit(1);
});
