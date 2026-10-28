import { describe, it, expect } from 'vitest';
import { envSchema } from './env.schema';
import { AI } from '@history-learning/shared';

describe('envSchema AI_SIMILARITY_THRESHOLD', () => {
  const minimalValidEnv = {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/hl',
    JWT_SECRET: 'this-is-a-very-long-secret-key-12345',
  };

  it('defaults to AI.SIMILARITY_THRESHOLD (0.65) when not provided', () => {
    const parsed = envSchema.parse({
      ...minimalValidEnv,
    });
    expect(parsed.AI_SIMILARITY_THRESHOLD).toBe(AI.SIMILARITY_THRESHOLD);
  });

  it('defaults to AI.SIMILARITY_THRESHOLD (0.65) when empty string is passed', () => {
    const parsed = envSchema.parse({
      ...minimalValidEnv,
      AI_SIMILARITY_THRESHOLD: '',
    });
    expect(parsed.AI_SIMILARITY_THRESHOLD).toBe(AI.SIMILARITY_THRESHOLD);
  });

  it('parses valid custom threshold string or number in 0..1', () => {
    const parsed1 = envSchema.parse({
      ...minimalValidEnv,
      AI_SIMILARITY_THRESHOLD: '0.72',
    });
    expect(parsed1.AI_SIMILARITY_THRESHOLD).toBe(0.72);

    const parsed2 = envSchema.parse({
      ...minimalValidEnv,
      AI_SIMILARITY_THRESHOLD: 0,
    });
    expect(parsed2.AI_SIMILARITY_THRESHOLD).toBe(0);

    const parsed3 = envSchema.parse({
      ...minimalValidEnv,
      AI_SIMILARITY_THRESHOLD: 1,
    });
    expect(parsed3.AI_SIMILARITY_THRESHOLD).toBe(1);
  });

  it('rejects values less than 0 or greater than 1', () => {
    expect(() =>
      envSchema.parse({
        ...minimalValidEnv,
        AI_SIMILARITY_THRESHOLD: '-0.1',
      }),
    ).toThrow();

    expect(() =>
      envSchema.parse({
        ...minimalValidEnv,
        AI_SIMILARITY_THRESHOLD: '1.2',
      }),
    ).toThrow();
  });

  it('rejects non-numeric values', () => {
    expect(() =>
      envSchema.parse({
        ...minimalValidEnv,
        AI_SIMILARITY_THRESHOLD: 'abc',
      }),
    ).toThrow();
  });
});
