import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { AI, type AiChatDto, type AiChatResponseDto } from '@history-learning/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AI_PROVIDER, type AiProvider } from './ai.provider';
import { RETRIEVER, type Retriever } from './retriever.interface';

export function normalizeRefusalText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/^["'«»“”„‘’`*_~\s([\]+|["'«»“”„‘’`*_~\s)\].,!?:;]+$/g, '')
    .trim();
}

export function isModelRefusal(answer: string): boolean {
  if (!answer) return false;
  const norm = normalizeRefusalText(answer);
  const normModelRefusal = normalizeRefusalText(AI.MODEL_REFUSAL_MESSAGE);
  const normNoContextRefusal = normalizeRefusalText(AI.NO_CONTEXT_REFUSAL_MESSAGE);

  if (norm === normModelRefusal || norm === normNoContextRefusal) {
    return true;
  }
  if (norm.includes(normModelRefusal) || norm.includes(normNoContextRefusal)) {
    return true;
  }
  return false;
}

@Injectable()
export class ChatService {
  constructor(
    @Inject(RETRIEVER) private readonly retriever: Retriever,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    private readonly prisma: PrismaService,
  ) {}

  async chat(
    dto: AiChatDto,
    user?: { id?: string; gradeId?: string },
  ): Promise<AiChatResponseDto> {
    // 1. If lessonId is explicitly provided, validate it exists and is PUBLISHED
    if (dto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lessonId },
        select: { id: true, status: true },
      });

      if (!lesson) {
        throw new AppError(
          ErrorCodes.LESSON_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Bài học không tồn tại',
        );
      }

      if (lesson.status !== 'PUBLISHED') {
        throw new AppError(
          ErrorCodes.LESSON_NOT_PUBLISHED,
          HttpStatus.NOT_FOUND,
          'Bài học chưa được xuất bản',
        );
      }
    }

    // 2. Perform retrieval with user's gradeId passed to retriever
    const retrieval = await this.retriever.retrieve({
      question: dto.question,
      history: dto.history,
      lessonId: dto.lessonId,
      gradeId: user?.gradeId,
    });

    // 3. I2: If no relevant context found (below threshold), return refusal immediately
    // DO NOT call chat model.
    if (!retrieval.accepted || retrieval.segments.length === 0) {
      return {
        answer: AI.NO_CONTEXT_REFUSAL_MESSAGE,
        sources: [],
      };
    }

    // 4. Build prompt with context and 4 strict rules
    const contextText = retrieval.segments
      .map((seg, idx) => {
        const headingPart = seg.heading ? ` - ${seg.heading}` : '';
        return `[Tài liệu ${idx + 1}: ${seg.title}${headingPart}]\n${seg.content}`;
      })
      .join('\n\n---\n\n');

    const systemPrompt = `Bạn là trợ lý AI học tập chuyên về Lịch sử Việt Nam cho học sinh phổ thông.
Nhiệm vụ của bạn là giải đáp câu hỏi của học sinh dựa trên các trích đoạn bài học được cung cấp dưới đây.

BẮT BUỘC TUÂN THỦ 4 NGUYÊN TẮC:
1. Chỉ sử dụng thông tin có trong phần "NGỮ CẢNH BÀI HỌC" bên dưới để trả lời.
2. Nếu câu hỏi không thể trả lời được từ các dữ kiện có trong ngữ cảnh, bắt buộc phải trả lời chính xác từng chữ cụm từ sau và KHÔNG giải thích gì thêm:
"${AI.MODEL_REFUSAL_MESSAGE}"
3. Tuyệt đối KHÔNG sử dụng kiến thức bên ngoài ngữ cảnh, không suy diễn, không tự thêm thông tin hay bịa đặt.
4. Trình bày rõ ràng, sư phạm, thân thiện; trích dẫn rõ tiêu đề mục hoặc tên bài học khi đề cập đến các sự kiện, nhân vật.

NGỮ CẢNH BÀI HỌC:
${contextText}`;

    const rawAnswer = await this.aiProvider.chat({
      systemPrompt,
      history: dto.history,
      userMessage: dto.question,
    });

    const trimmedAnswer = rawAnswer.trim();

    // 5. I1: If model refused to answer or indicated insufficient context, sources=[]
    // Robust check handling quotes, punctuation, case variations, markdown formatting
    if (isModelRefusal(trimmedAnswer)) {
      return {
        answer: AI.MODEL_REFUSAL_MESSAGE,
        sources: [],
      };
    }

    // Server-verified sources
    return {
      answer: trimmedAnswer,
      sources: retrieval.sources,
    };
  }
}
