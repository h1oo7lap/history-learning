import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export class EmbeddingDiskCache {
  private cacheDir: string;

  constructor(customDir?: string) {
    if (customDir) {
      this.cacheDir = customDir;
    } else {
      // Find workspace root or default to .cache/embeddings
      const rootDir = process.cwd();
      this.cacheDir = path.resolve(rootDir, '.cache', 'embeddings');
    }

    if (!fs.existsSync(this.cacheDir)) {
      try {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      } catch {
        // Silently continue if directory creation fails or exists
      }
    }
  }

  public getCacheKey(provider: string, model: string, dimensions: number, text: string): string {
    const raw = `${provider}:${model}:${dimensions}:${text}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public get(provider: string, model: string, dimensions: number, text: string): number[] | null {
    try {
      const key = this.getCacheKey(provider, model, dimensions, text);
      const filePath = path.join(this.cacheDir, `${key}.json`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.embedding)) {
        return data.embedding;
      }
      return null;
    } catch {
      return null;
    }
  }

  public set(
    provider: string,
    model: string,
    dimensions: number,
    text: string,
    embedding: number[],
  ): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      const key = this.getCacheKey(provider, model, dimensions, text);
      const filePath = path.join(this.cacheDir, `${key}.json`);

      const payload = {
        provider,
        model,
        dimensions,
        text,
        embedding,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(filePath, JSON.stringify(payload), 'utf-8');
    } catch {
      // Disk write failure should never break runtime execution
    }
  }
}
