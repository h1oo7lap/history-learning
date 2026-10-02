import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Auto-load .env so DATABASE_URL is set before setup.ts overrides it
    envFile: '../../.env',
    // Run test files serially so each file's beforeEach DB truncation
    // doesn't invalidate JWT cookies obtained in another file's setup.
    fileParallelism: false,
  },
});

