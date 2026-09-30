import { createHash, randomBytes } from 'crypto';

/**
 * Generate a cryptographically random hex token.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Hash a token with SHA-256 for safe storage.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
