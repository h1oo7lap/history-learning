import dotenv from 'dotenv';
dotenv.config();

import fs from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiEmbeddingProvider } from '../gemini-embedding.provider';
import { GeminiProvider } from '../gemini.provider';
import { VectorRetriever } from '../vector-retriever';
import { ChatService, isModelRefusal } from '../chat.service';
import {
  DEFAULT_PACING_MS,
  sleep,
  withRateLimitRetry,
  isApiError,
} from './eval-retry-helper';

export function stripVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .trim();
}

export function startsWithGreeting(text: string): boolean {
  const norm = stripVietnameseAccents(text).trim();
  const greetingPatterns = [
    /^chao(\s+(em|ban|cac\s+ban|quy\s+vi|anh|chi))?([!.,:\s]|$)/,
    /^xin\s+chao/,
    /^kinh\s+chao/,
    /^hello\b/,
    /^hi\b/,
    /^hey\b/,
  ];
  return greetingPatterns.some((pattern) => pattern.test(norm));
}

export function checkExpectedFacts(
  answer: string,
  facts: string[],
): { passed: boolean; missing: string[] } {
  const normAnswer = stripVietnameseAccents(answer);
  const missing: string[] = [];

  for (const fact of facts) {
    const normFact = stripVietnameseAccents(fact);
    if (!normAnswer.includes(normFact)) {
      missing.push(fact);
    }
  }

  return {
    passed: missing.length === 0,
    missing,
  };
}

interface AnswerEvalItem {
  id: string;
  lessonSlug: string;
  lessonTitle: string;
  question: string;
  expectedFacts: string[];
  expectRefusal?: boolean;
  category?: string;
}

interface AnswerEvalResult {
  id: string;
  category: string;
  question: string;
  expectedSlug: string;
  expectRefusal: boolean;
  answer: string;
  sources: Array<{ lessonId: string; title: string; slug: string }>;
  isCorrectSource: boolean;
  noGreeting: boolean;
  factsCheck: { passed: boolean; missing: string[] };
  isRefusal: boolean;
  sourcesEmpty: boolean;
  status: 'PASSED' | 'FAILED' | 'API_ERROR';
  failureReason?: string;
}

async function runAnswerEval() {
  console.log('================================================================================');
  console.log('=== History Learning — AI Chat Answer Quality Evaluation (ai:answer-eval)    ===');
  console.log('=== Chế độ: ChatService + Gemini Embedding & Chat Model THẬT (Chỉ Đọc DB)    ===');
  console.log('================================================================================\n');

  const config = new ConfigService();
  const apiKey = config.get<string>('AI_API_KEY')?.trim() || config.get<string>('GEMINI_API_KEY')?.trim();

  if (!apiKey) {
    console.error('FATAL: Script ai:answer-eval từ chối chạy vì thiếu AI_API_KEY / GEMINI_API_KEY.');
    process.exit(1);
  }

  const model = config.get<string>('AI_MODEL')?.trim() || 'gemini-3.5-flash-lite';
  console.log(`Provider  : GeminiProvider (@google/genai)`);
  console.log(`Chat Model: ${model}`);
  console.log(`Embedding : GeminiEmbeddingProvider (768 dims, Disk Cache)`);
  console.log(`Giãn cách : ~${(DEFAULT_PACING_MS / 1000).toFixed(1)}s giữa các request thật`);
  console.log(`Database  : Chỉ Đọc (SELECT chunks & lessons)\n`);

  const prisma = new PrismaService(config);
  await prisma.$connect();

  const embeddingProvider = new GeminiEmbeddingProvider(config);
  const retriever = new VectorRetriever(prisma, embeddingProvider, config);
  const chatProvider = new GeminiProvider(config);
  const chatService = new ChatService(retriever, chatProvider, prisma);

  const dataPath = path.resolve(__dirname, '../../../test/ai/answer-eval.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`FATAL: File không tồn tại: ${dataPath}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const evalItems: AnswerEvalItem[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Đã nạp ${evalItems.length} câu hỏi đánh giá chất lượng câu trả lời.\n`);

  const results: AnswerEvalResult[] = [];

  for (let i = 0; i < evalItems.length; i++) {
    const item = evalItems[i]!;
    const category = item.category || (item.expectRefusal ? 'ngoài kho / vi phạm' : 'trong kho');
    process.stdout.write(`Đang xử lý câu [${item.id}] (${i + 1}/${evalItems.length}) [${category}]... `);

    // Giãn cách mặc định giữa các request thật
    if (i > 0) {
      await sleep(DEFAULT_PACING_MS);
    }

    try {
      const response = await withRateLimitRetry(
        () =>
          chatService.chat({
            question: item.question,
            history: [],
          }),
        { label: `[${item.id}]` },
      );

      const answer = response.answer;
      const sources = response.sources;
      const isRefusal = isModelRefusal(answer);
      const sourcesEmpty = sources.length === 0;
      const noGreeting = !startsWithGreeting(answer);

      let status: 'PASSED' | 'FAILED' = 'FAILED';
      let failureReason: string | undefined;

      if (item.expectRefusal) {
        // Refusal expected: must be refusal message AND sources must be empty
        const allPassed = isRefusal && sourcesEmpty;
        status = allPassed ? 'PASSED' : 'FAILED';
        if (!allPassed) {
          const reasons: string[] = [];
          if (!isRefusal) reasons.push('Không trả về câu từ chối chuẩn');
          if (!sourcesEmpty) reasons.push(`Sources không rỗng (${sources.map((s) => s.slug).join(', ')})`);
          failureReason = reasons.join('; ');
        }
      } else {
        // In-scope question: must match expected source, no greeting, all facts present, and not refusal
        const isCorrectSource = sources.some((s) => s.slug === item.lessonSlug);
        const factsCheck = checkExpectedFacts(answer, item.expectedFacts);
        const allPassed = isCorrectSource && noGreeting && factsCheck.passed && !isRefusal;
        status = allPassed ? 'PASSED' : 'FAILED';
        if (!allPassed) {
          const reasons: string[] = [];
          if (!isCorrectSource) reasons.push(`Sai nguồn (kỳ vọng ${item.lessonSlug}, nhận ${sources.map((s) => s.slug).join(', ') || 'RỖNG'})`);
          if (!noGreeting) reasons.push('Bắt đầu bằng lời chào');
          if (!factsCheck.passed) reasons.push(`Thiếu facts (${factsCheck.missing.join(', ')})`);
          if (isRefusal) reasons.push('Bị từ chối oan');
          failureReason = reasons.join('; ');
        }
      }

      results.push({
        id: item.id,
        category,
        question: item.question,
        expectedSlug: item.lessonSlug,
        expectRefusal: !!item.expectRefusal,
        answer,
        sources,
        isCorrectSource: sources.some((s) => s.slug === item.lessonSlug),
        noGreeting,
        factsCheck: checkExpectedFacts(answer, item.expectedFacts),
        isRefusal,
        sourcesEmpty,
        status,
        failureReason,
      });

      console.log(status === 'PASSED' ? '✓ ĐẠT' : `✗ KHÔNG ĐẠT (${failureReason})`);
    } catch (err: any) {
      const apiErr = isApiError(err);
      console.log(`✗ ${apiErr ? 'LỖI API (429/timeout)' : 'LỖI'}: ${err?.message || err}`);
      results.push({
        id: item.id,
        category,
        question: item.question,
        expectedSlug: item.lessonSlug,
        expectRefusal: !!item.expectRefusal,
        answer: `[LỖI] ${err?.message || err}`,
        sources: [],
        isCorrectSource: false,
        noGreeting: false,
        factsCheck: { passed: false, missing: item.expectedFacts },
        isRefusal: false,
        sourcesEmpty: true,
        status: apiErr ? 'API_ERROR' : 'FAILED',
        failureReason: `Lỗi: ${err?.message || err}`,
      });
    }
  }

  await prisma.$disconnect();

  // ============================================================================
  // PHẦN 1: BẢNG KẾT QUẢ TÁCH RÕ BA NHÓM (ĐẠT, TRƯỢT, LỖI API)
  // ============================================================================
  const passedGroup = results.filter((r) => r.status === 'PASSED');
  const failedGroup = results.filter((r) => r.status === 'FAILED');
  const apiErrorGroup = results.filter((r) => r.status === 'API_ERROR');

  console.log('\n================================================================================');
  console.log('BẢNG KẾT QUẢ ĐÁNH GIÁ CHẤT LƯỢNG CÂU TRẢ LỜI (TÁCH 3 NHÓM RÕ RỆT):');
  console.log('================================================================================\n');

  console.log('--- NHÓM 1: CÁC CÂU ĐẠT (PASSED) ---');
  if (passedGroup.length === 0) {
    console.log('(Không có câu nào)\n');
  } else {
    console.log(
      '| ID          | Phân loại         | Nguồn đúng/rỗng? | Không chào? | Đủ facts/Từ chối? | Đánh giá |',
    );
    console.log(
      '|-------------|-------------------|------------------|-------------|-------------------|----------|',
    );
    for (const r of passedGroup) {
      const idCol = r.id.padEnd(11);
      const catCol = r.category.padEnd(17);
      const srcCol = (r.expectRefusal ? (r.sourcesEmpty ? '✓ RỖNG' : '✗ CÓ NGUỒN') : (r.isCorrectSource ? '✓ ĐÚNG' : '✗ SAI')).padEnd(16);
      const greetCol = (r.noGreeting ? '✓ TỐT' : '✗ CÓ CHÀO').padEnd(11);
      const factsCol = (r.expectRefusal ? (r.isRefusal ? '✓ TỪ CHỐI' : '✗ KHÔNG TỪ CHỐI') : (r.factsCheck.passed ? '✓ ĐỦ FACTS' : '✗ THIẾU')).padEnd(17);
      console.log(`| ${idCol} | ${catCol} | ${srcCol} | ${greetCol} | ${factsCol} | ✓ ĐẠT    |`);
    }
    console.log(`=> Tổng số câu đạt: ${passedGroup.length}/${results.length}\n`);
  }

  console.log('--- NHÓM 2: CÁC CÂU TRƯỢT (FAILED) ---');
  if (failedGroup.length === 0) {
    console.log('(Không có câu nào trượt — Hoàn hảo!)\n');
  } else {
    console.log(
      '| ID          | Phân loại         | Lý do trượt                                                           |',
    );
    console.log(
      '|-------------|-------------------|-----------------------------------------------------------------------|',
    );
    for (const r of failedGroup) {
      const idCol = r.id.padEnd(11);
      const catCol = r.category.padEnd(17);
      const reasonCol = (r.failureReason || 'Không rõ').slice(0, 69).padEnd(69);
      console.log(`| ${idCol} | ${catCol} | ${reasonCol} |`);
    }
    console.log(`=> Tổng số câu trượt: ${failedGroup.length}/${results.length}\n`);
  }

  console.log('--- NHÓM 3: LỖI API (429/TIMEOUT) — TÍNH RIÊNG, KHÔNG TÍNH VÀO TỈ LỆ ĐẠT/TRƯỢT ---');
  if (apiErrorGroup.length === 0) {
    console.log('(Không có lỗi API nào — Mạng và Quota ổn định!)\n');
  } else {
    console.log(
      '| ID          | Phân loại         | Chi tiết lỗi API                                                      |',
    );
    console.log(
      '|-------------|-------------------|-----------------------------------------------------------------------|',
    );
    for (const r of apiErrorGroup) {
      const idCol = r.id.padEnd(11);
      const catCol = r.category.padEnd(17);
      const errCol = (r.failureReason || 'Lỗi API').slice(0, 69).padEnd(69);
      console.log(`| ${idCol} | ${catCol} | ${errCol} |`);
    }
    console.log(`=> Tổng số câu gặp lỗi API: ${apiErrorGroup.length} câu (được tính riêng)\n`);
  }

  // ============================================================================
  // PHẦN 2: BẢNG RIÊNG NHÓM "NGOÀI KHO + DỤ VI PHẠM" VỚI NỘI DUNG CÂU TRẢ LỜI THỰC TẾ
  // ============================================================================
  const refusalGroup = results.filter((r) => r.expectRefusal);

  console.log('================================================================================');
  console.log('CHI TIẾT NHÓM "NGOÀI KHO + DỤ VI PHẠM" (KÈM CÂU TRẢ LỜI THỰC TẾ CỦA MODEL):');
  console.log('================================================================================\n');

  for (let idx = 0; idx < refusalGroup.length; idx++) {
    const item = refusalGroup[idx]!;
    const statusText =
      item.status === 'PASSED'
        ? '✓ ĐẠT'
        : item.status === 'API_ERROR'
          ? '⚠ LỖI API (429/timeout)'
          : '✗ KHÔNG ĐẠT';

    console.log(`[${idx + 1}/10] Câu [${item.id}] — Nhóm: "${item.category.toUpperCase()}"`);
    console.log(`  - Câu hỏi         : "${item.question}"`);
    console.log(`  - Kỳ vọng         : Từ chối theo quy định & sources rỗng`);
    console.log(`  - Kết quả đánh giá: ${statusText}`);
    console.log(`  - Sources trả về  : ${item.sources.length === 0 ? '[] (RỖNG - Đúng quy định)' : JSON.stringify(item.sources)}`);
    console.log(`  - Từ chối chuẩn?  : ${item.isRefusal ? 'CÓ (Khớp thông báo từ chối)' : 'KHÔNG'}`);
    console.log(`  - Nội dung câu trả lời thực tế:`);
    console.log(`    """`);
    console.log(`    ${item.answer.replace(/\n/g, '\n    ')}`);
    console.log(`    """\n`);
  }

  // ============================================================================
  // PHẦN 3: TỔNG HỢP VÀ TỈ LỆ
  // ============================================================================
  const total = results.length;
  const passedTotal = passedGroup.length;
  const failedTotal = failedGroup.length;
  const apiErrorTotal = apiErrorGroup.length;
  const validEvaluatedTotal = passedTotal + failedTotal;

  console.log('================================================================================');
  console.log('TỔNG HỢP CHỈ SỐ EVALUATION (ai:answer-eval):');
  console.log(`  - Tổng số câu hỏi nạp vào       : ${total}`);
  console.log(`  - Số câu đạt (Passed)           : ${passedTotal}`);
  console.log(`  - Số câu trượt (Failed)         : ${failedTotal}`);
  console.log(`  - Số câu lỗi API (429/timeout)  : ${apiErrorTotal} (TÍNH RIÊNG, KHÔNG TÍNH VÀO TỈ LỆ ĐẠT/TRƯỢT)`);
  console.log(`  - Tổng số câu đánh giá hợp lệ   : ${validEvaluatedTotal}`);
  if (validEvaluatedTotal > 0) {
    const overallRate = ((passedTotal / validEvaluatedTotal) * 100).toFixed(1);
    console.log(`  ==> TỈ LỆ ĐẠT TOÀN DIỆN (trên câu hợp lệ): ${passedTotal}/${validEvaluatedTotal} (${overallRate}%)`);
  }
  console.log('================================================================================\n');
}

runAnswerEval().catch((err) => {
  console.error('[ai:answer-eval error]:', err?.message || err);
  process.exit(1);
});
