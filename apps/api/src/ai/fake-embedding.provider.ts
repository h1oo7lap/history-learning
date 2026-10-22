import { Injectable } from '@nestjs/common';
import { EmbeddingProvider } from './embedding.provider';
import { AI } from '@history-learning/shared';
import { tokenizeAndFilter, extractBigrams } from './retrieval';

@Injectable()
export class FakeEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions = AI.EMBEDDING_DIMENSIONS || 768;

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.generateVector(t));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.generateVector(text);
  }

  /**
   * Deterministic semantic embedding into 768 dimensions with L2 normalization.
   * Simulates dense neural embedding properties: texts in the same historical
   * topic/concept cluster align closely (similarity > 0.65), while unrelated
   * texts have low similarity (< 0.10).
   */
  public generateVector(text: string): number[] {
    const vector = Array.from({ length: this.dimensions }, () => 0);
    const tokens = tokenizeAndFilter(text);
    const bigrams = extractBigrams(tokens);

    if (tokens.length === 0) {
      vector[0] = 1.0;
      return vector;
    }

    const topics = this.extractTopics(tokens, bigrams);

    // Topic centroid representation (aligns texts belonging to the same topic)
    if (topics.length > 0) {
      for (const t of topics) {
        const topicVec = this.pseudoRandomUnitVector(t);
        for (let i = 0; i < this.dimensions; i++) {
          vector[i] += 0.85 * topicVec[i]!;
        }
      }
    }

    // Detail features (bag of words + bigrams)
    for (const token of tokens) {
      const idx = this.hashString(token) % this.dimensions;
      vector[idx] += 0.05;
    }
    for (const bg of bigrams) {
      const idx = this.hashString(bg) % this.dimensions;
      vector[idx] += 0.1;
    }

    // L2 Normalize
    let sumSq = 0;
    for (let i = 0; i < this.dimensions; i++) {
      sumSq += vector[i]! * vector[i]!;
    }

    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = vector[i]! / norm;
      }
    } else {
      vector[0] = 1.0;
    }

    return vector;
  }

  private extractTopics(tokens: string[], bigrams: string[]): string[] {
    const topics: string[] = [];
    const textStr = ' ' + tokens.join(' ') + ' ';

    const known = [
      { key: 'bach_dang', words: ['bach dang', 'ngo quyen', 'coc ngam', '938'] },
      { key: 'dien_bien', words: ['dien bien', 'nava', 'de castries', '1954'] },
      { key: 'ly_thai_to', words: ['ly thai to', 'doi do', 'thang long', 'dai la'] },
      { key: 'dinh_bo_linh', words: ['dinh bo linh', '12 su quan', 'hoa lu'] },
      { key: 'nguyen_mong', words: ['mong co', 'nguyen mong', 'dong a', 'tran hung dao'] },
      { key: 'lam_son', words: ['lam son', 'le loi', 'binh ngo dai cao'] },
      { key: 'quang_trung', words: ['quang trung', 'ngoc hoi', 'dong da', 'nguyen hue'] },
      { key: 'hung_vuong', words: ['hung vuong', 'lac long quan', 'au co', 'phong chau'] },
    ];

    for (const k of known) {
      if (k.words.some((w) => textStr.includes(w) || bigrams.includes(w))) {
        topics.push(k.key);
      }
    }

    // Fallback: top 2 distinctive tokens
    if (topics.length === 0) {
      const sig = tokens.filter((t) => t.length >= 4).slice(0, 2);
      if (sig.length > 0) {
        topics.push(sig.sort().join('_'));
      }
    }

    return topics;
  }

  private pseudoRandomUnitVector(key: string): number[] {
    const vec = Array.from({ length: this.dimensions }, () => 0);
    let seed = this.hashString(key);
    for (let i = 0; i < this.dimensions; i++) {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      vec[i] = (seed / 0x7fffffff) * 2 - 1;
    }
    let sumSq = 0;
    for (let i = 0; i < this.dimensions; i++) sumSq += vec[i]! * vec[i]!;
    const norm = Math.sqrt(sumSq);
    for (let i = 0; i < this.dimensions; i++) vec[i] /= norm;
    return vec;
  }

  private hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
  }
}
