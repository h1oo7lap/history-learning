import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { EmbeddingProvider } from './embedding.provider';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AI } from '@history-learning/shared';

function normalizeVector(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i]! * vec[i]!;
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

function isRateLimitError(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    err?.statusCode === 429 ||
    /429|resource[_\s]+(?:has\s+been\s+)?exhausted|rate\s*limit|quota/i.test(err?.message || '')
  );
}

@Injectable()
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = new Logger(GeminiEmbeddingProvider.name);
  private readonly dimensions = AI.EMBEDDING_DIMENSIONS || 768;
  public readonly usesDiskCache = true;

  constructor(private readonly config: ConfigService) {}

  get modelIdentifier(): string {
    const model = this.config.get<string>('AI_EMBEDDING_MODEL')?.trim() || 'gemini-embedding-2';
    return `gemini:${model}`;
  }

  private getClient(): { ai: GoogleGenAI; model: string } {
    const apiKey = this.config.get<string>('AI_API_KEY')?.trim();
    const model = this.config.get<string>('AI_EMBEDDING_MODEL')?.trim();

    if (!apiKey || !model) {
      this.logger.warn('AI embedding request failed: AI_API_KEY or AI_EMBEDDING_MODEL is not configured');
      throw new AppError(
        ErrorCodes.AI_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Dịch vụ nhúng văn bản AI hiện chưa sẵn sàng. Vui lòng cấu hình AI_EMBEDDING_MODEL và AI_API_KEY.',
      );
    }

    return {
      ai: new GoogleGenAI({ apiKey }),
      model,
    };
  }

  private validateAndNormalize(vals: any[], contextInfo: string): number[] {
    if (
      !Array.isArray(vals) ||
      vals.length !== this.dimensions ||
      vals.some((v) => typeof v !== 'number' || !Number.isFinite(v))
    ) {
      throw new Error(
        `Vector trả về không hợp lệ cho ${contextInfo}: độ dài ${vals?.length ?? 0}/${this.dimensions}, có phần tử NaN hoặc không phải số hữu hạn.`,
      );
    }

    const normalized = normalizeVector(vals);
    let sumSq = 0;
    for (let k = 0; k < normalized.length; k++) {
      sumSq += normalized[k]! * normalized[k]!;
    }
    const norm = Math.sqrt(sumSq);
    if (Math.abs(norm - 1) >= 1e-3) {
      throw new Error(`Vector cho ${contextInfo} có chuẩn L2 lệch chuẩn: norm=${norm.toFixed(5)}`);
    }

    return normalized;
  }

  private async embedSingleDocumentWithRetry(
    ai: GoogleGenAI,
    model: string,
    text: string,
    chunkIndex: number,
  ): Promise<number[]> {
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.embedContent({
          model,
          contents: text,
          config: {
            taskType: 'RETRIEVAL_DOCUMENT',
            outputDimensionality: this.dimensions,
          },
        });

        const vals =
          response.embeddings?.[0]?.values ||
          (response as any).embedding?.values ||
          [];

        return this.validateAndNormalize(vals, `chunk #${chunkIndex}`);
      } catch (err: any) {
        lastError = err;
        this.logger.warn(
          `Lỗi nhúng chunk #${chunkIndex} (thử lần ${attempt}/${maxRetries}): ${err?.message || 'unknown error'}`,
        );
        if (attempt < maxRetries) {
          const delayMs = isRateLimitError(err) ? 1500 * attempt : 500;
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }

    if (isRateLimitError(lastError)) {
      throw new AppError(
        ErrorCodes.AI_BUSY,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Hệ thống đang bận, vui lòng thử lại sau ít phút',
      );
    }

    throw new AppError(
      ErrorCodes.AI_UNAVAILABLE,
      HttpStatus.SERVICE_UNAVAILABLE,
      `Không thể tạo embedding hợp lệ cho chunk #${chunkIndex}: ${lastError?.message || 'thất bại sau các lần thử'}`,
    );
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const { ai, model } = this.getClient();

    const results: number[][] = [];
    const concurrency = 5;

    for (let i = 0; i < texts.length; i += concurrency) {
      const batch = texts.slice(i, i + concurrency);
      try {
        const batchResults = await Promise.all(
          batch.map((text, idx) =>
            this.embedSingleDocumentWithRetry(ai, model, text, i + idx),
          ),
        );
        results.push(...batchResults);
      } catch (err: any) {
        this.logger.error(`Gemini embedDocuments error: ${err?.message || 'unknown error'}`);
        if (err instanceof AppError) throw err;

        if (isRateLimitError(err)) {
          throw new AppError(
            ErrorCodes.AI_BUSY,
            HttpStatus.SERVICE_UNAVAILABLE,
            'Hệ thống đang bận, vui lòng thử lại sau ít phút',
          );
        }

        throw new AppError(
          ErrorCodes.AI_UNAVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
          `Dịch vụ tạo vector embedding thất bại: ${err?.message || 'unknown error'}`,
        );
      }
    }

    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const { ai, model } = this.getClient();

    try {
      const response = await ai.models.embedContent({
        model,
        contents: text,
        config: {
          taskType: 'RETRIEVAL_QUERY',
          outputDimensionality: this.dimensions,
        },
      });

      const vals =
        response.embeddings?.[0]?.values ||
        (response as any).embedding?.values ||
        [];

      return this.validateAndNormalize(vals, 'câu hỏi query');
    } catch (err: any) {
      this.logger.error(`Gemini embedQuery error: ${err?.message || 'unknown error'}`);
      if (err instanceof AppError) throw err;

      if (isRateLimitError(err)) {
        throw new AppError(
          ErrorCodes.AI_BUSY,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Hệ thống đang bận, vui lòng thử lại sau ít phút',
        );
      }

      throw new AppError(
        ErrorCodes.AI_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Dịch vụ tạo vector embedding cho câu hỏi hiện đang gặp sự cố hoặc quá tải.',
      );
    }
  }
}
