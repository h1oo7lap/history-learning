import dotenv from 'dotenv';
dotenv.config();

import fs from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiEmbeddingProvider } from '../gemini-embedding.provider';
import { GeminiProvider } from '../gemini.provider';
import { VectorRetriever } from '../vector-retriever';
import { ChatService } from '../chat.service';

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
}

interface AnswerEvalResult {
  id: string;
  question: string;
  expectedSlug: string;
  answer: string;
  sources: Array<{ lessonId: string; title: string; slug: string }>;
  isCorrectSource: boolean;
  noGreeting: boolean;
  factsCheck: { passed: boolean; missing: string[] };
  allPassed: boolean;
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
    process.stdout.write(`Đang xử lý câu [${item.id}] (${i + 1}/${evalItems.length})... `);

    try {
      const response = await chatService.chat({
        question: item.question,
        history: [],
      });

      const answer = response.answer;
      const sources = response.sources;

      const isCorrectSource = sources.some((s) => s.slug === item.lessonSlug);
      const noGreeting = !startsWithGreeting(answer);
      const factsCheck = checkExpectedFacts(answer, item.expectedFacts);
      const allPassed = isCorrectSource && noGreeting && factsCheck.passed;

      results.push({
        id: item.id,
        question: item.question,
        expectedSlug: item.lessonSlug,
        answer,
        sources,
        isCorrectSource,
        noGreeting,
        factsCheck,
        allPassed,
      });

      console.log(allPassed ? '✓ ĐẠT' : '✗ KHÔNG ĐẠT');
    } catch (err: any) {
      console.log(`✗ LỖI: ${err?.message || err}`);
      results.push({
        id: item.id,
        question: item.question,
        expectedSlug: item.lessonSlug,
        answer: `[ERROR] ${err?.message || err}`,
        sources: [],
        isCorrectSource: false,
        noGreeting: false,
        factsCheck: { passed: false, missing: item.expectedFacts },
        allPassed: false,
      });
    }
  }

  await prisma.$disconnect();

  console.log('\n================================================================================');
  console.log('BẢNG KẾT QUẢ ĐÁNH GIÁ CHẤT LƯỢNG CÂU TRẢ LỜI:');
  console.log('================================================================================\n');

  console.log(
    '| ID     | Nguồn đúng? | Không chào? | Đủ Facts? | Toàn bộ? | Bài học kỳ vọng                       |',
  );
  console.log(
    '|--------|-------------|-------------|-----------|----------|---------------------------------------|',
  );

  for (const r of results) {
    const idCol = r.id.padEnd(6);
    const srcCol = (r.isCorrectSource ? '✓ ĐÚNG' : '✗ SAI').padEnd(11);
    const greetCol = (r.noGreeting ? '✓ TỐT' : '✗ CÓ CHÀO').padEnd(11);
    const factsCol = (r.factsCheck.passed ? '✓ ĐỦ' : `✗ THIẾU(${r.factsCheck.missing.length})`).padEnd(9);
    const allCol = (r.allPassed ? '✓ ĐẠT' : '✗ HỎNG').padEnd(8);
    const slugCol = r.expectedSlug.slice(0, 37).padEnd(37);

    console.log(`| ${idCol} | ${srcCol} | ${greetCol} | ${factsCol} | ${allCol} | ${slugCol} |`);
  }

  const failedItems = results.filter((r) => !r.allPassed);
  if (failedItems.length > 0) {
    console.log('\n--------------------------------------------------------------------------------');
    console.log('CHI TIẾT CÁC CÂU CHƯA ĐẠT:');
    console.log('--------------------------------------------------------------------------------');
    for (const f of failedItems) {
      console.log(`\n* [${f.id}] "${f.question}"`);
      console.log(`  - Nguồn nhận được: ${f.sources.map((s) => s.slug).join(', ') || 'RỖNG'}`);
      console.log(`  - Nguồn kỳ vọng  : ${f.expectedSlug}`);
      console.log(`  - Không chào     : ${f.noGreeting ? 'ĐẠT' : 'VI PHẠM (bắt đầu bằng lời chào)'}`);
      console.log(
        `  - Facts thiếu    : ${f.factsCheck.missing.length > 0 ? f.factsCheck.missing.join(', ') : 'Không thiếu'}`,
      );
      console.log(`  - Câu trả lời mẫu:\n    "${f.answer.slice(0, 300).replace(/\n/g, ' ')}..."`);
    }
  }

  const total = results.length;
  const passedTotal = results.filter((r) => r.allPassed).length;
  const passedSources = results.filter((r) => r.isCorrectSource).length;
  const passedGreetings = results.filter((r) => r.noGreeting).length;
  const passedFacts = results.filter((r) => r.factsCheck.passed).length;

  console.log('\n================================================================================');
  console.log('TỔNG HỢP CHỈ SỐ CHẤT LƯỢNG CÂU TRẢ LỜI:');
  console.log(`  1. Tỉ lệ nguồn bài chính xác : ${passedSources}/${total} (${((passedSources / total) * 100).toFixed(1)}%)`);
  console.log(`  2. Tỉ lệ không mở đầu bằng chào: ${passedGreetings}/${total} (${((passedGreetings / total) * 100).toFixed(1)}%)`);
  console.log(`  3. Tỉ lệ đầy đủ facts/mốc thời gian: ${passedFacts}/${total} (${((passedFacts / total) * 100).toFixed(1)}%)`);
  console.log(`  ==> TỈ LỆ ĐẠT TOÀN DIỆN (ALL-PASS): ${passedTotal}/${total} (${((passedTotal / total) * 100).toFixed(1)}%)`);
  console.log('================================================================================\n');
}

runAnswerEval().catch((err) => {
  console.error('[ai:answer-eval error]:', err?.message || err);
  process.exit(1);
});
