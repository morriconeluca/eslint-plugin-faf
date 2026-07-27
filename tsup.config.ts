import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
  entry: ['src/main.ts'],
  format: ['cjs', 'esm'],
  minify: false,
  shims: true, // Auto-inject shims for CJS/ESM compatibility (e.g. __dirname, __filename)
  sourcemap: true,
});
