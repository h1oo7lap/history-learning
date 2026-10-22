import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AiProvider, AiChatParams } from './ai.provider';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AI } from '../common/config/constants';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly config: ConfigService) {}

  async chat(params: AiChatParams): Promise<string> {
    const apiKey = this.config.get<string>('AI_API_KEY')?.trim();
    const model = this.config.get<string>('AI_MODEL')?.trim();
    const timeoutMs = Number(this.config.get<string>('AI_TIMEOUT_MS')) || 30000;

    // Missing AI_API_KEY or AI_MODEL must not crash on startup, but returns 503 on request
    if (!apiKey || !model) {
      this.logger.warn('AI request failed: AI_API_KEY or AI_MODEL is not configured');
      throw new AppError(
        ErrorCodes.AI_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Dịch vụ trợ lý AI hiện chưa sẵn sàng. Vui lòng thử lại sau.',
      );
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (params.history && params.history.length > 0) {
        for (const msg of params.history) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: params.userMessage }],
      });

      const abortController = new AbortController();
      let timeoutId: NodeJS.Timeout | undefined;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new Error('AI request timed out'));
        }, timeoutMs);
      });

      const apiPromise = ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: params.systemPrompt,
          maxOutputTokens: AI.MAX_OUTPUT_TOKENS,
          abortSignal: abortController.signal,
        },
      });

      try {
        const response = await Promise.race([apiPromise, timeoutPromise]);
        return response.text?.trim() || '';
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    } catch (err: any) {
      // Security: do NOT log apiKey, user prompt, or secrets
      this.logger.error(`AI generation error: ${err?.message || 'unknown error'}`);
      throw new AppError(
        ErrorCodes.AI_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Dịch vụ trợ lý AI hiện đang gặp sự cố hoặc quá tải. Vui lòng thử lại sau ít phút.',
      );
    }
  }
}
