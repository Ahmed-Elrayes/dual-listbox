import { defineConfig } from 'tsup';

export default defineConfig([
    // ESM → .js
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        outExtension: () => ({ js: '.js' }),
        dts: true,
        sourcemap: true,
        clean: true,
        target: 'es2018',
        minify: false,
        treeshake: true,
    },
    // CJS → .cjs
    {
        entry: ['src/index.ts'],
        format: ['cjs'],
        outExtension: () => ({ js: '.cjs' }),
        clean: false,
        sourcemap: true,
        target: 'es2018',
        minify: false,
        treeshake: true,
    }
]);
