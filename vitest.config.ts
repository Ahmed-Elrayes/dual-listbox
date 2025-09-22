import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        css: false,
        coverage: {
            provider: 'v8',
            reportsDirectory: './coverage',
            include: ['src/**/*.ts'],    // include all source TS files
            exclude: ['src/types.ts'],    // optionally exclude types only
            reporter: ['text', 'lcov'],   // text for console, lcov for HTML
        },
    },
});
