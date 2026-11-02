import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0',
    },
  },
  entry: ['src/main.ts'],
  external: ['oxc-parser', 'oxc-resolver'],
  format: ['cjs', 'esm'],
  minify: false,
  shims: true,
  sourcemap: true,
});
