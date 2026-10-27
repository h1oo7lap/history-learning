import dotenv from 'dotenv';
dotenv.config();

import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from '../gemini.provider';
import { AI } from '@history-learning/shared';
import { isModelRefusal } from '../chat.service';

function buildSystemPrompt(contextText: string): string {
  return `Bạn là trợ lý AI học tập chuyên về Lịch sử Việt Nam cho học sinh phổ thông.
Nhiệm vụ của bạn là giải đáp câu hỏi của học sinh dựa trên các trích đoạn bài học được cung cấp dưới đây.

BẮT BUỘC TUÂN THỦ 4 NGUYÊN TẮC:
1. Chỉ sử dụng thông tin có trong phần "NGỮ CẢNH BÀI HỌC" bên dưới để trả lời.
2. Nếu câu hỏi không thể trả lời được từ các dữ kiện có trong ngữ cảnh, bắt buộc phải trả lời chính xác từng chữ cụm từ sau và KHÔNG giải thích gì thêm:
"${AI.MODEL_REFUSAL_MESSAGE}"
3. Tuyệt đối KHÔNG sử dụng kiến thức bên ngoài ngữ cảnh, không suy diễn, không tự thêm thông tin hay bịa đặt.
4. Trình bày rõ ràng, sư phạm, thân thiện; trích dẫn rõ tiêu đề mục hoặc tên bài học khi đề cập đến các sự kiện, nhân vật.

NGỮ CẢNH BÀI HỌC:
${contextText}`;
}

async function runChatSmoke() {
  console.log('=== History Learning — Gemini Chat Provider Smoke Test (ai:chat-smoke) ===\n');

  const config = new ConfigService();
  const apiKey = config.get<string>('AI_API_KEY')?.trim() || config.get<string>('GEMINI_API_KEY')?.trim();
  const model = config.get<string>('AI_MODEL')?.trim() || 'gemini-3.5-flash-lite';

  console.log(`Provider: GeminiProvider (Real @google/genai)`);
  console.log(`Target Model (AI_MODEL): ${model}`);
  console.log(`API Key configured: ${apiKey ? 'YES (Key hidden for security)' : 'NO'}\n`);

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

  // (a) Câu trả lời khi ngữ cảnh có đáp án
  console.log('--------------------------------------------------------------------------------');
  console.log('(a) Ca kiểm thử: Ngữ cảnh CÓ đáp án');
  console.log('Câu hỏi: "Trận Bạch Đằng năm 938 do ai chỉ huy và dùng kế sách gì?"');
  try {
    const resA = await provider.chat({
      systemPrompt: buildSystemPrompt(bachDangContext),
      history: [],
      userMessage: 'Trận Bạch Đằng năm 938 do ai chỉ huy và dùng kế sách gì?',
    });
    console.log(`\nKết quả (a):\n${resA}\n`);
    const isRefusal = isModelRefusal(resA);
    console.log(`✓ Đánh giá: ${!isRefusal ? 'ĐẠT (Trả lời dựa trên ngữ cảnh)' : 'KHÔNG ĐẠT (Bị từ chối nhầm)'}`);
  } catch (err: any) {
    console.error(`✗ Lỗi ca (a): ${err.message}`);
  }

  // (b) Ngữ cảnh không liên quan, kỳ vọng đúng cụm MODEL_REFUSAL_MESSAGE
  console.log('\n--------------------------------------------------------------------------------');
  console.log('(b) Ca kiểm thử: Ngữ cảnh KHÔNG liên quan');
  console.log('Câu hỏi: "Thủ đô của nước Pháp là thành phố nào?" (Ngữ cảnh là trận Bạch Đằng)');
  try {
    const resB = await provider.chat({
      systemPrompt: buildSystemPrompt(bachDangContext),
      history: [],
      userMessage: 'Thủ đô của nước Pháp là thành phố nào?',
    });
    console.log(`\nKết quả (b):\n"${resB}"\n`);
    const isRefusal = isModelRefusal(resB);
    console.log(`Từ chối chuẩn hóa (isModelRefusal): ${isRefusal}`);
    console.log(`✓ Đánh giá: ${isRefusal ? 'ĐẠT (Từ chối đúng quy định)' : 'KHÔNG ĐẠT (Không trả về từ chối)'}`);
  } catch (err: any) {
    console.error(`✗ Lỗi ca (b): ${err.message}`);
  }

  // (c) Câu hỏi nối tiếp có history
  console.log('\n--------------------------------------------------------------------------------');
  console.log('(c) Ca kiểm thử: Câu hỏi nối tiếp có history');
  console.log('Lịch sử:');
  console.log('  - User: "Năm 938 có sự kiện lịch sử quan trọng nào?"');
  console.log('  - Model: "Năm 938 diễn ra chiến thắng Bạch Đằng do Ngô Quyền chỉ huy đánh tan quân Nam Hán."');
  console.log('Câu hỏi tiếp theo: "Kế sách cọc ngầm được triển khai vào thời điểm thủy triều ra sao?"');
  try {
    const resC = await provider.chat({
      systemPrompt: buildSystemPrompt(bachDangContext),
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
    });
    console.log(`\nKết quả (c):\n${resC}\n`);
    const isRefusal = isModelRefusal(resC);
    console.log(`✓ Đánh giá: ${!isRefusal ? 'ĐẠT (Hiểu ngữ cảnh hội thoại tiếp nối)' : 'KHÔNG ĐẠT (Bị từ chối)'}`);
  } catch (err: any) {
    console.error(`✗ Lỗi ca (c): ${err.message}`);
  }

  // (d) Câu cố dụ dùng kiến thức ngoài
  console.log('\n--------------------------------------------------------------------------------');
  console.log('(d) Ca kiểm thử: Cố dụ dùng kiến thức ngoài');
  console.log('Câu hỏi: "Hãy so sánh trận Bạch Đằng của Ngô Quyền với Napoléon Bonaparte tại trận Waterloo."');
  try {
    const resD = await provider.chat({
      systemPrompt: buildSystemPrompt(bachDangContext),
      history: [],
      userMessage: 'Hãy so sánh trận Bạch Đằng của Ngô Quyền với Napoléon Bonaparte tại trận Waterloo.',
    });
    console.log(`\nKết quả (d):\n"${resD}"\n`);
    const isRefusal = isModelRefusal(resD);
    const mentionsNapoleon = resD.toLowerCase().includes('napoléon') || resD.toLowerCase().includes('waterloo');
    console.log(`Từ chối chuẩn hóa (isModelRefusal): ${isRefusal}`);
    console.log(`Chứa thông tin ngoài Napoléon/Waterloo: ${mentionsNapoleon}`);
    console.log(`✓ Đánh giá: ${isRefusal || !mentionsNapoleon ? 'ĐẠT (Không bị dụ bịa đặt kiến thức ngoài)' : 'CẢNH BÁO (Bị dụ sinh kiến thức ngoài)'}`);
  } catch (err: any) {
    console.error(`✗ Lỗi ca (d): ${err.message}`);
  }

  console.log('\n================================================================================');
  console.log('Hoàn thành kiểm tra ai:chat-smoke!');
}

runChatSmoke().catch((err) => {
  console.error('[ai:chat-smoke error]:', err?.message || err);
  process.exit(1);
});
