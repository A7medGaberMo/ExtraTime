import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts', 'convex/**/*.test.ts'],
    exclude: ['node_modules', 'convex/_generated/**'],
    environment: 'node',
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
