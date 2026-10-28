import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { GeminiProvider } from './gemini.provider';
import { ErrorCodes } from '../common/errors/error-codes';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe('GeminiProvider (Unit)', () => {
  let provider: GeminiProvider;
  let mockConfigService: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'AI_API_KEY') return 'test-key';
        if (key === 'AI_MODEL') return 'gemini-3.5-flash-lite';
        if (key === 'AI_TIMEOUT_MS') return '5000';
        return undefined;
      }),
    };
    provider = new GeminiProvider(mockConfigService as unknown as ConfigService);
  });

  it('throws 503 AI_UNAVAILABLE when API key or model is missing', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'AI_API_KEY') return '';
      return undefined;
    });

    await expect(
      provider.chat({ systemPrompt: 'Sys', history: [], userMessage: 'Hi' }),
    ).rejects.toMatchObject({
      code: ErrorCodes.AI_UNAVAILABLE,
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
  });

  it('returns text response on successful generation', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Trận Bạch Đằng năm 938 do Ngô Quyền chỉ huy.',
    });

    const res = await provider.chat({
      systemPrompt: 'System',
      history: [],
      userMessage: 'Ai chỉ huy trận Bạch Đằng?',
    });

    expect(res).toBe('Trận Bạch Đằng năm 938 do Ngô Quyền chỉ huy.');
  });

  it('maps 429 status from GoogleGenAI to AI_BUSY with status 503 and Vietnamese message', async () => {
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;
    mockGenerateContent.mockRejectedValue(error429);

    await expect(
      provider.chat({ systemPrompt: 'System', history: [], userMessage: 'Test' }),
    ).rejects.toMatchObject({
      code: ErrorCodes.AI_BUSY,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Hệ thống đang bận, vui lòng thử lại sau ít phút',
    });
  });

  it('maps RESOURCE_EXHAUSTED message from GoogleGenAI to AI_BUSY with status 503', async () => {
    const exhaustedError = new Error('Resource has been exhausted (e.g. check quota)');
    mockGenerateContent.mockRejectedValue(exhaustedError);

    await expect(
      provider.chat({ systemPrompt: 'System', history: [], userMessage: 'Test' }),
    ).rejects.toMatchObject({
      code: ErrorCodes.AI_BUSY,
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Hệ thống đang bận, vui lòng thử lại sau ít phút',
    });
  });

  it('maps generic error from GoogleGenAI to AI_UNAVAILABLE with status 503', async () => {
    const genericErr = new Error('Internal server error at upstream');
    mockGenerateContent.mockRejectedValue(genericErr);

    await expect(
      provider.chat({ systemPrompt: 'System', history: [], userMessage: 'Test' }),
    ).rejects.toMatchObject({
      code: ErrorCodes.AI_UNAVAILABLE,
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
  });
});
