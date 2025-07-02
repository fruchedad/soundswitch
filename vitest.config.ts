import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        'docs/',
        'icons/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  }
}); 