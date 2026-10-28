import { describe, it, expect } from 'vitest';
import { FakeEmbeddingProvider } from './fake-embedding.provider';

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i]! * b[i]!;
  }
  return sum;
}

describe('FakeEmbeddingProvider', () => {
  const provider = new FakeEmbeddingProvider();

  it('generates 768-dimensional L2-normalized vectors', async () => {
    const vec = await provider.embedQuery('Chiến thắng Bạch Đằng năm 938');
    expect(vec.length).toBe(768);

    const l2Norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    expect(l2Norm).toBeCloseTo(1.0, 5);
  });

  it('produces higher similarity for semantically related texts than unrelated texts', async () => {
    const docBachDang = await provider.embedQuery(
      'Ngô Quyền cắm cọc nhọn trên sông Bạch Đằng năm 938 đánh tan quân Nam Hán',
    );
    const queryBachDang = await provider.embedQuery('Trận Bạch Đằng năm 938 do ai chỉ huy?');
    const queryPhap = await provider.embedQuery('Thủ đô của nước Pháp là gì?');

    const scoreRelated = dotProduct(docBachDang, queryBachDang);
    const scoreUnrelated = dotProduct(docBachDang, queryPhap);

    expect(scoreRelated).toBeGreaterThan(0.35);
    expect(scoreUnrelated).toBeLessThan(0.05);
  });
});
