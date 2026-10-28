import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { GeminiEmbeddingProvider } from './gemini-embedding.provider';
import { ErrorCodes } from '../common/errors/error-codes';

const mockEmbedContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        embedContent: mockEmbedContent,
      };
    },
  };
});

describe('GeminiEmbeddingProvider (Unit)', () => {
  let provider: GeminiEmbeddingProvider;
  let mockConfigService: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'AI_API_KEY') return 'test-key';
        if (key === 'AI_EMBEDDING_MODEL') return 'gemini-embedding-2';
        return undefined;
      }),
    };
    provider = new GeminiEmbeddingProvider(mockConfigService as unknown as ConfigService);
  });

  it('throws 503 AI_UNAVAILABLE when AI_API_KEY or AI_EMBEDDING_MODEL is missing', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'AI_API_KEY') return '';
      return undefined;
    });

    await expect(provider.embedQuery('test')).rejects.toMatchObject({
      code: ErrorCodes.AI_UNAVAILABLE,
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
  });

  it('maps 429 status on embedQuery to AI_BUSY with status 503 and Vietnamese message', async () => {
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;
    mockEmbedContent.mockRejectedValue(error429);

    await expect(provider.embedQuery('test')).rejects.toMatchObject({
      code: ErrorCodes.AI_BUSY,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Hệ thống đang bận, vui lòng thử lại sau ít phút',
    });
  });

  it('maps RESOURCE_EXHAUSTED message on embedQuery to AI_BUSY with status 503', async () => {
    const exhaustedError = new Error('Resource has been exhausted');
    mockEmbedContent.mockRejectedValue(exhaustedError);

    await expect(provider.embedQuery('test')).rejects.toMatchObject({
      code: ErrorCodes.AI_BUSY,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Hệ thống đang bận, vui lòng thử lại sau ít phút',
    });
  });

  it('maps 429 on embedDocuments to AI_BUSY with status 503', async () => {
    const error429 = new Error('Quota exceeded 429');
    (error429 as any).status = 429;
    mockEmbedContent.mockRejectedValue(error429);

    await expect(provider.embedDocuments(['test document'])).rejects.toMatchObject({
      code: ErrorCodes.AI_BUSY,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Hệ thống đang bận, vui lòng thử lại sau ít phút',
    });
  });
});

