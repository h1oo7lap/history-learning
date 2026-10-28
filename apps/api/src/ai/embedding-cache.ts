import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export class EmbeddingDiskCache {
  private cacheDir: string;

  constructor(customDir?: string) {
    if (customDir) {
      this.cacheDir = customDir;
    } else {
      // Find workspace root or apps/api consistently
      let baseDir = process.cwd();
      if (!fs.existsSync(path.join(baseDir, 'package.json'))) {
        baseDir = path.resolve(__dirname, '../../../');
      }
      // If we are in root workspace, target apps/api/.cache/embeddings
      if (fs.existsSync(path.join(baseDir, 'apps', 'api'))) {
        this.cacheDir = path.resolve(baseDir, 'apps', 'api', '.cache', 'embeddings');
      } else {
        this.cacheDir = path.resolve(baseDir, '.cache', 'embeddings');
      }
    }

    if (!fs.existsSync(this.cacheDir)) {
      try {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      } catch {
        // Silently continue if directory creation fails or exists
      }
    }
  }

  public getCacheDir(): string {
    return this.cacheDir;
  }

  public getCacheKey(provider: string, model: string, dimensions: number, text: string): string {
    const raw = `${provider}:${model}:${dimensions}:${text}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public get(provider: string, model: string, dimensions: number, text: string): number[] | null {
    const key = this.getCacheKey(provider, model, dimensions, text);
    const filePath = path.join(this.cacheDir, `${key}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      if (
        Array.isArray(data.embedding) &&
        data.embedding.length === dimensions &&
        data.embedding.every((v: any) => typeof v === 'number' && Number.isFinite(v))
      ) {
        return data.embedding;
      }

      // Invalid cache entry (wrong dimensions, non-finite, empty) -> delete corrupt file
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore unlink failure
      }
      return null;
    } catch {
      // Corrupt JSON or unreadable file -> delete corrupt file
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore unlink failure
      }
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
    // Safety check: Never write empty or invalid dimensions or non-finite vectors to disk cache
    if (
      !Array.isArray(embedding) ||
      embedding.length !== dimensions ||
      embedding.some((v) => typeof v !== 'number' || !Number.isFinite(v))
    ) {
      return;
    }

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
