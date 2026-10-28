import { Injectable } from '@nestjs/common';
import { AiProvider, AiChatParams } from './ai.provider';

@Injectable()
export class FakeAiProvider implements AiProvider {
  public mockAnswer: string | null = null;
  public mockError: Error | null = null;
  public lastChatParams: AiChatParams | null = null;

  async chat(params: AiChatParams): Promise<string> {
    this.lastChatParams = params;

    if (this.mockError) {
      throw this.mockError;
    }

    if (this.mockAnswer !== null) {
      return this.mockAnswer;
    }

    if (params.userMessage.includes('Bạch Đằng')) {
      return 'Trận Bạch Đằng năm 938 do Ngô Quyền lãnh đạo đã đánh tan quân Nam Hán.';
    }

    if (params.userMessage.includes('Chiếu dời đô') || params.userMessage.includes('Dời đô')) {
      return 'Năm 1010, vua Lý Thái Tổ quyết định dời đô từ Hoa Lư về Thăng Long.';
    }

    if (params.userMessage.includes('Điện Biên Phủ')) {
      return 'Chiến dịch Điện Biên Phủ diễn ra trong 56 ngày đêm từ tháng 3 đến tháng 5 năm 1954.';
    }

    return 'Đây là câu trả lời thử nghiệm từ trợ lý AI lịch sử.';
  }

  setMockAnswer(answer: string | null): void {
    this.mockAnswer = answer;
  }

  setMockError(error: Error | null): void {
    this.mockError = error;
  }

  reset(): void {
    this.mockAnswer = null;
    this.mockError = null;
    this.lastChatParams = null;
  }
}
