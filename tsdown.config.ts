import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['./compress.ts'],
    target: ['node20'],
    exports: true,
    clean: false,
    outDir: '.',
});
