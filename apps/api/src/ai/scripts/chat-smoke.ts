import dotenv from 'dotenv';
dotenv.config();

import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from '../gemini.provider';
import { isModelRefusal, buildChatSystemPrompt } from '../chat.service';
import {
  DEFAULT_PACING_MS,
  sleep,
  withRateLimitRetry,
  isApiError,
} from './eval-retry-helper';

interface SmokeCaseResult {
  name: string;
  question: string;
  status: 'PASSED' | 'FAILED' | 'API_ERROR';
  details: string;
}

async function runChatSmoke() {
  console.log('=== History Learning — Gemini Chat Provider Smoke Test (ai:chat-smoke) ===\n');

  const config = new ConfigService();
  const apiKey = config.get<string>('AI_API_KEY')?.trim() || config.get<string>('GEMINI_API_KEY')?.trim();
  const model = config.get<string>('AI_MODEL')?.trim() || 'gemini-3.5-flash-lite';

  console.log(`Provider: GeminiProvider (Real @google/genai)`);
  console.log(`Target Model (AI_MODEL): ${model}`);
  console.log(`API Key configured: ${apiKey ? 'YES (Key hidden for security)' : 'NO'}`);
  console.log(`Giãn cách mặc định: ~${(DEFAULT_PACING_MS / 1000).toFixed(1)}s giữa các request thật\n`);

  if (!apiKey) {
    console.error('ERROR: AI_API_KEY / GEMINI_API_KEY is not set in environment.');
    process.exit(1);
  }

  const provider = new GeminiProvider(config);

  const bachDangContext = `[Tài liệu 1: Chiến thắng Bạch Đằng năm 938 - Diễn biến chiến dịch]
Năm 938, chúa Nam Hán sai con trai là Lưu Hoằng Tháo đem thủy quân sang xâm lược nước ta.
Ngô Quyền họp các tướng lĩnh, chọn cửa sông Bạch Đằng hiểm yếu làm nơi quyết chiến.
Ông cho quân đẵn gỗ lim, vót nhọn đầu rồi cắm xuống lòng sông ở những vị trí hiểm yếu.
Khi thủy triều lên, cọc gỗ ngập dưới mặt nước. Ngô Quyền cho thuyền nhẹ ra khiêu chiến rồi vờ thua rút chạy.
Khi thủy triều rút nhanh, cọc nhọn nhô lên, thuyền chiến to lớn của giặc Nam Hán mắc cạn và bị cọc nhọn đâm thủng, tan vỡ hoàn toàn. Lưu Hoằng Tháo tử trận.`;

  const results: SmokeCaseResult[] = [];

  // (a) Câu trả lời khi ngữ cảnh có đáp án
  console.log('--------------------------------------------------------------------------------');
  console.log('(a) Ca kiểm thử: Ngữ cảnh CÓ đáp án');
  console.log('Câu hỏi: "Trận Bạch Đằng năm 938 do ai chỉ huy và dùng kế sách gì?"');
  try {
    const resA = await withRateLimitRetry(
      () =>
        provider.chat({
          systemPrompt: buildChatSystemPrompt(bachDangContext),
          history: [],
          userMessage: 'Trận Bạch Đằng năm 938 do ai chỉ huy và dùng kế sách gì?',
        }),
      { label: 'Ca (a)' },
    );
    console.log(`\nKết quả (a):\n${resA}\n`);
    const isRefusal = isModelRefusal(resA);
    const passed = !isRefusal;
    console.log(`✓ Đánh giá: ${passed ? 'ĐẠT (Trả lời dựa trên ngữ cảnh)' : 'KHÔNG ĐẠT (Bị từ chối nhầm)'}`);
    results.push({
      name: '(a) Ngữ cảnh có đáp án',
      question: 'Trận Bạch Đằng năm 938 do ai chỉ huy và dùng kế sách gì?',
      status: passed ? 'PASSED' : 'FAILED',
      details: passed ? 'Trả lời thành công dựa trên ngữ cảnh' : 'Bị từ chối nhầm',
    });
  } catch (err: any) {
    const apiErr = isApiError(err);
    console.error(`✗ Lỗi ca (a): ${err.message} ${apiErr ? '(Lỗi API - 429/timeout)' : ''}`);
    results.push({
      name: '(a) Ngữ cảnh có đáp án',
      question: 'Trận Bạch Đằng năm 938 do ai chỉ huy và dùng kế sách gì?',
      status: apiErr ? 'API_ERROR' : 'FAILED',
      details: err.message,
    });
  }

  // Giãn cách giữa các request thật
  await sleep(DEFAULT_PACING_MS);

  // (b) Ngữ cảnh không liên quan, kỳ vọng đúng cụm MODEL_REFUSAL_MESSAGE
  console.log('\n--------------------------------------------------------------------------------');
  console.log('(b) Ca kiểm thử: Ngữ cảnh KHÔNG liên quan');
  console.log('Câu hỏi: "Thủ đô của nước Pháp là thành phố nào?" (Ngữ cảnh là trận Bạch Đằng)');
  try {
    const resB = await withRateLimitRetry(
      () =>
        provider.chat({
          systemPrompt: buildChatSystemPrompt(bachDangContext),
          history: [],
          userMessage: 'Thủ đô của nước Pháp là thành phố nào?',
        }),
      { label: 'Ca (b)' },
    );
    console.log(`\nKết quả (b):\n"${resB}"\n`);
    const isRefusal = isModelRefusal(resB);
    console.log(`Từ chối chuẩn hóa (isModelRefusal): ${isRefusal}`);
    console.log(`✓ Đánh giá: ${isRefusal ? 'ĐẠT (Từ chối đúng quy định)' : 'KHÔNG ĐẠT (Không trả về từ chối)'}`);
    results.push({
      name: '(b) Ngữ cảnh không liên quan',
      question: 'Thủ đô của nước Pháp là thành phố nào?',
      status: isRefusal ? 'PASSED' : 'FAILED',
      details: isRefusal ? 'Từ chối đúng quy định' : 'Không từ chối khi ngữ cảnh không liên quan',
    });
  } catch (err: any) {
    const apiErr = isApiError(err);
    console.error(`✗ Lỗi ca (b): ${err.message} ${apiErr ? '(Lỗi API - 429/timeout)' : ''}`);
    results.push({
      name: '(b) Ngữ cảnh không liên quan',
      question: 'Thủ đô của nước Pháp là thành phố nào?',
      status: apiErr ? 'API_ERROR' : 'FAILED',
      details: err.message,
    });
  }

  // Giãn cách giữa các request thật
  await sleep(DEFAULT_PACING_MS);

  // (c) Câu hỏi nối tiếp có history
  console.log('\n--------------------------------------------------------------------------------');
  console.log('(c) Ca kiểm thử: Câu hỏi nối tiếp có history');
  console.log('Lịch sử:');
  console.log('  - User: "Năm 938 có sự kiện lịch sử quan trọng nào?"');
  console.log('  - Model: "Năm 938 diễn ra chiến thắng Bạch Đằng do Ngô Quyền chỉ huy đánh tan quân Nam Hán."');
  console.log('Câu hỏi tiếp theo: "Kế sách cọc ngầm được triển khai vào thời điểm thủy triều ra sao?"');
  try {
    const resC = await withRateLimitRetry(
      () =>
        provider.chat({
          systemPrompt: buildChatSystemPrompt(bachDangContext),
          history: [
            {
              role: 'user',
              content: 'Năm 938 có sự kiện lịch sử quan trọng nào?',
            },
            {
              role: 'model',
              content: 'Năm 938 diễn ra chiến thắng Bạch Đằng do Ngô Quyền chỉ huy đánh tan quân Nam Hán.',
            },
          ],
          userMessage: 'Kế sách cọc ngầm được triển khai vào thời điểm thủy triều ra sao?',
        }),
      { label: 'Ca (c)' },
    );
    console.log(`\nKết quả (c):\n${resC}\n`);
    const isRefusal = isModelRefusal(resC);
    const passed = !isRefusal;
    console.log(`✓ Đánh giá: ${passed ? 'ĐẠT (Hiểu ngữ cảnh hội thoại tiếp nối)' : 'KHÔNG ĐẠT (Bị từ chối)'}`);
    results.push({
      name: '(c) Câu hỏi nối tiếp có history',
      question: 'Kế sách cọc ngầm được triển khai vào thời điểm thủy triều ra sao?',
      status: passed ? 'PASSED' : 'FAILED',
      details: passed ? 'Hiểu tốt ngữ cảnh hội thoại tiếp nối' : 'Bị từ chối nhầm',
    });
  } catch (err: any) {
    const apiErr = isApiError(err);
    console.error(`✗ Lỗi ca (c): ${err.message} ${apiErr ? '(Lỗi API - 429/timeout)' : ''}`);
    results.push({
      name: '(c) Câu hỏi nối tiếp có history',
      question: 'Kế sách cọc ngầm được triển khai vào thời điểm thủy triều ra sao?',
      status: apiErr ? 'API_ERROR' : 'FAILED',
      details: err.message,
    });
  }

  // Giãn cách giữa các request thật
  await sleep(DEFAULT_PACING_MS);

  // (d) Câu cố dụ dùng kiến thức ngoài
  console.log('\n--------------------------------------------------------------------------------');
  console.log('(d) Ca kiểm thử: Cố dụ dùng kiến thức ngoài');
  console.log('Câu hỏi: "Hãy so sánh trận Bạch Đằng của Ngô Quyền với Napoléon Bonaparte tại trận Waterloo."');
  try {
    const resD = await withRateLimitRetry(
      () =>
        provider.chat({
          systemPrompt: buildChatSystemPrompt(bachDangContext),
          history: [],
          userMessage: 'Hãy so sánh trận Bạch Đằng của Ngô Quyền với Napoléon Bonaparte tại trận Waterloo.',
        }),
      { label: 'Ca (d)' },
    );
    console.log(`\nKết quả (d):\n"${resD}"\n`);
    const isRefusal = isModelRefusal(resD);
    const mentionsNapoleon = resD.toLowerCase().includes('napoléon') || resD.toLowerCase().includes('waterloo');
    console.log(`Từ chối chuẩn hóa (isModelRefusal): ${isRefusal}`);
    console.log(`Chứa thông tin ngoài Napoléon/Waterloo: ${mentionsNapoleon}`);
    const passed = isRefusal || !mentionsNapoleon;
    console.log(`✓ Đánh giá: ${passed ? 'ĐẠT (Không bị dụ bịa đặt kiến thức ngoài)' : 'CẢNH BÁO (Bị dụ sinh kiến thức ngoài)'}`);
    results.push({
      name: '(d) Cố dụ dùng kiến thức ngoài',
      question: 'Hãy so sánh trận Bạch Đằng của Ngô Quyền với Napoléon Bonaparte tại trận Waterloo.',
      status: passed ? 'PASSED' : 'FAILED',
      details: passed ? 'Không bị dụ sinh kiến thức ngoài' : 'Bị dụ sinh kiến thức ngoài',
    });
  } catch (err: any) {
    const apiErr = isApiError(err);
    console.error(`✗ Lỗi ca (d): ${err.message} ${apiErr ? '(Lỗi API - 429/timeout)' : ''}`);
    results.push({
      name: '(d) Cố dụ dùng kiến thức ngoài',
      question: 'Hãy so sánh trận Bạch Đằng của Ngô Quyền với Napoléon Bonaparte tại trận Waterloo.',
      status: apiErr ? 'API_ERROR' : 'FAILED',
      details: err.message,
    });
  }

  console.log('\n================================================================================');
  console.log('TỔNG HỢP KẾT QUẢ AI:CHAT-SMOKE (PHÂN BIỆT RÕ LỖI API)');
  console.log('================================================================================');
  console.log('| Ca kiểm thử                              | Trạng thái   | Chi tiết                               |');
  console.log('|------------------------------------------|--------------|----------------------------------------|');

  for (const r of results) {
    const nameCol = r.name.padEnd(40);
    const statusText =
      r.status === 'PASSED' ? '✓ ĐẠT' : r.status === 'API_ERROR' ? '⚠ LỖI API' : '✗ TRƯỢT';
    const statusCol = statusText.padEnd(12);
    const detailCol = r.details.slice(0, 38).padEnd(38);
    console.log(`| ${nameCol} | ${statusCol} | ${detailCol} |`);
  }

  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;
  const apiErrorCount = results.filter((r) => r.status === 'API_ERROR').length;
  const validTotal = passedCount + failedCount;

  console.log('\n--- Thống kê ca kiểm thử ---');
  console.log(`  - Tổng ca kiểm thử : ${results.length}`);
  console.log(`  - Số ca Đạt        : ${passedCount}`);
  console.log(`  - Số ca Trượt      : ${failedCount}`);
  console.log(`  - Lỗi API (429/to) : ${apiErrorCount} (TÍNH RIÊNG, KHÔNG TÍNH VÀO TỈ LỆ ĐẠT/TRƯỢT)`);
  if (validTotal > 0) {
    console.log(`  ==> TỈ LỆ ĐẠT (trên các ca hợp lệ): ${passedCount}/${validTotal} (${((passedCount / validTotal) * 100).toFixed(1)}%)`);
  }
  console.log('================================================================================\n');
}

runChatSmoke().catch((err) => {
  console.error('[ai:chat-smoke error]:', err?.message || err);
  process.exit(1);
});
