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

@Injectable()
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = new Logger(GeminiEmbeddingProvider.name);
  private readonly dimensions = AI.EMBEDDING_DIMENSIONS || 768;

  constructor(private readonly config: ConfigService) {}

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

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const { ai, model } = this.getClient();

    const results: number[][] = [];
    const batchSize = 10;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        const response = await ai.models.embedContent({
          model,
          contents: batch.length === 1 ? batch[0] : batch,
          config: {
            taskType: 'RETRIEVAL_DOCUMENT',
            outputDimensionality: this.dimensions,
          },
        });

        const rawEmbeddings =
          response.embeddings ||
          ((response as any).embedding ? [(response as any).embedding] : []);

        for (let j = 0; j < batch.length; j++) {
          const vals = rawEmbeddings[j]?.values || [];
          results.push(normalizeVector(vals));
        }
      } catch (err: any) {
        // Do not log API keys or secrets
        this.logger.error(`Gemini embedDocuments error: ${err?.message || 'unknown error'}`);
        throw new AppError(
          ErrorCodes.AI_UNAVAILABLE,
          HttpStatus.SERVICE_UNAVAILABLE,
          'Dịch vụ tạo vector embedding hiện đang gặp sự cố hoặc quá tải.',
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

      return normalizeVector(vals);
    } catch (err: any) {
      // Do not log API keys or secrets
      this.logger.error(`Gemini embedQuery error: ${err?.message || 'unknown error'}`);
      throw new AppError(
        ErrorCodes.AI_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Dịch vụ tạo vector embedding cho câu hỏi hiện đang gặp sự cố hoặc quá tải.',
      );
    }
  }
}
