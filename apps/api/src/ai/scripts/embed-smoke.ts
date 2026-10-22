import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

function l2Norm(vec: number[]): number {
  return Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
}

function normalize(vec: number[]): number[] {
  const norm = l2Norm(vec);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

async function runSmokeTest() {
  const apiKey = process.env['AI_API_KEY']?.trim() || process.env['GEMINI_API_KEY']?.trim();
  const model = process.env['AI_EMBEDDING_MODEL']?.trim() || 'text-embedding-004';

  console.log(`[Smoke Test] Target model: ${model}`);
  if (!apiKey) {
    console.error('[Smoke Test] ERROR: No API key found in process.env (AI_API_KEY or GEMINI_API_KEY)');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  const docCorrect = 'Bài: Chiến thắng Bạch Đằng năm 938 | Nhân vật: Ngô Quyền\n\nNăm 938, Ngô Quyền lãnh đạo quân dân đánh tan quân Nam Hán trên sông Bạch Đằng nhờ cắm bãi cọc nhọn.';
  const docWrong = 'Bài: Phong trào Cần Vương cuối thế kỷ XIX | Nhân vật: Tôn Thất Thuyết, Vua Hàm Nghi\n\nNăm 1885, Tôn Thất Thuyết phò tá vua Hàm Nghi ra sơn phòng Quảng Trị ban Chiếu Cần Vương kêu gọi toàn dân kháng Pháp.';
  const query = 'Trận Bạch Đằng năm 938 do ai chỉ huy và dùng kế sách gì?';

  // 1. Test WITH taskType
  console.log('\n--- Test 1: Calling embedContent WITH taskType ---');
  let supportsTaskType = false;
  try {
    const resDoc = await ai.models.embedContent({
      model,
      contents: docCorrect,
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      },
    });

    const resQuery = await ai.models.embedContent({
      model,
      contents: query,
      config: {
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 768,
      },
    });

    const resWrong = await ai.models.embedContent({
      model,
      contents: docWrong,
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      },
    });

    const vecDoc = resDoc.embeddings?.[0]?.values || (resDoc as any).embedding?.values || (resDoc as any).values || [];
    const vecQuery = resQuery.embeddings?.[0]?.values || (resQuery as any).embedding?.values || (resQuery as any).values || [];
    const vecWrong = resWrong.embeddings?.[0]?.values || (resWrong as any).embedding?.values || (resWrong as any).values || [];

    console.log('resDoc keys:', Object.keys(resDoc));
    if ((resDoc as any).embeddings) console.log('resDoc.embeddings length:', (resDoc as any).embeddings.length);

    console.log(`✓ Success with taskType!`);
    console.log(`  Doc vector dimensions: ${vecDoc.length}`);
    console.log(`  Query vector dimensions: ${vecQuery.length}`);
    console.log(`  Doc L2 norm (before client norm): ${l2Norm(vecDoc).toFixed(5)}`);
    console.log(`  Query L2 norm (before client norm): ${l2Norm(vecQuery).toFixed(5)}`);

    const simCorrect = dotProduct(normalize(vecQuery), normalize(vecDoc));
    const simWrong = dotProduct(normalize(vecQuery), normalize(vecWrong));

    console.log(`  Cosine similarity (Query vs Correct Chunk): ${simCorrect.toFixed(4)}`);
    console.log(`  Cosine similarity (Query vs Wrong Chunk):   ${simWrong.toFixed(4)}`);
    console.log(`  Gap (Correct - Wrong):                     ${(simCorrect - simWrong).toFixed(4)}`);
    supportsTaskType = true;
  } catch (err: any) {
    console.log(`✗ Call with taskType failed: ${err.message}`);
  }

  // 2. Test WITHOUT taskType
  console.log('\n--- Test 2: Calling embedContent WITHOUT taskType ---');
  try {
    const resDoc = await ai.models.embedContent({
      model,
      contents: docCorrect,
      config: {
        outputDimensionality: 768,
      },
    });

    const resQuery = await ai.models.embedContent({
      model,
      contents: query,
      config: {
        outputDimensionality: 768,
      },
    });

    const resWrong = await ai.models.embedContent({
      model,
      contents: docWrong,
      config: {
        outputDimensionality: 768,
      },
    });

    const vecDoc = resDoc.embeddings?.[0]?.values || (resDoc as any).embedding?.values || (resDoc as any).values || [];
    const vecQuery = resQuery.embeddings?.[0]?.values || (resQuery as any).embedding?.values || (resQuery as any).values || [];
    const vecWrong = resWrong.embeddings?.[0]?.values || (resWrong as any).embedding?.values || (resWrong as any).values || [];

    console.log(`✓ Success without taskType!`);
    console.log(`  Doc vector dimensions: ${vecDoc.length}`);
    console.log(`  Query vector dimensions: ${vecQuery.length}`);
    console.log(`  Doc L2 norm: ${l2Norm(vecDoc).toFixed(5)}`);
    console.log(`  Query L2 norm: ${l2Norm(vecQuery).toFixed(5)}`);

    const simCorrect = dotProduct(normalize(vecQuery), normalize(vecDoc));
    const simWrong = dotProduct(normalize(vecQuery), normalize(vecWrong));

    console.log(`  Cosine similarity (Query vs Correct Chunk): ${simCorrect.toFixed(4)}`);
    console.log(`  Cosine similarity (Query vs Wrong Chunk):   ${simWrong.toFixed(4)}`);
    console.log(`  Gap (Correct - Wrong):                     ${(simCorrect - simWrong).toFixed(4)}`);
  } catch (err: any) {
    console.log(`✗ Call without taskType failed: ${err.message}`);
  }

  console.log(`\n[Smoke Test Summary] supportsTaskType = ${supportsTaskType}`);
}

runSmokeTest().catch((err) => {
  console.error('[Smoke Test Error]', err.message);
  process.exit(1);
});
