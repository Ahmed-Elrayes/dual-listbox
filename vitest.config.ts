import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    css: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
    },
  },
});
