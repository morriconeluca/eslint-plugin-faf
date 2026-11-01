import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/**/types.ts',
        'src/**/env.d.ts',
      ],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      thresholds: {
        branches: 90,
        lines: 95,
        perFile: true,
      },
    },
    environment: 'node',
    globals: true,
    reporters: ['agent'],
  },
});
