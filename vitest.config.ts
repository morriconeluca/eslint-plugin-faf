import type { Reporter, TestModule } from 'vitest/node';

import { defineConfig } from 'vitest/config';

import { resolveExecutionTestTemporaryDirectory } from './test/support/test-temp-dir.js';

const createTimingReporter = (): Reporter => {
  type TProjectTiming = {
    end: number;
    readonly name: string;
    start: number;
  };
  const projectTimings = new Map<string, TProjectTiming>();

  return {
    onTestModuleEnd(testModule: TestModule): void {
      const projectName = testModule.project.name;
      const existing = projectTimings.get(projectName);
      if (existing !== undefined) {
        existing.end = performance.now();
      }
    },
    onTestModuleStart(testModule: TestModule): void {
      const projectName = testModule.project.name;
      const existing = projectTimings.get(projectName);
      if (existing === undefined) {
        projectTimings.set(projectName, {
          end: performance.now(),
          name: projectName,
          start: performance.now(),
        });
      }
    },
    onTestRunEnd(): void {
      for (const [name, timing] of projectTimings) {
        const durationSeconds = ((timing.end - timing.start) / 1000).toFixed(2);
        console.log(`[project:${name}] duration: ${durationSeconds}s`);
      }
    },
  };
};

const testTemporaryDirectory = resolveExecutionTestTemporaryDirectory();

const testTemporaryDirectoryEnvironment = {
  TEMP: testTemporaryDirectory,
  TMP: testTemporaryDirectory,
  TMPDIR: testTemporaryDirectory,
};

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/**/*.mock.ts', 'src/**/*.spec.ts', 'src/**/*.type.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      thresholds: {
        branches: 90,
        lines: 95,
        perFile: true,
      },
    },
    env: testTemporaryDirectoryEnvironment,
    environment: 'node',
    globals: true,
    globalSetup: ['./test/support/test-temp-dir.ts'],
    projects: [
      {
        test: {
          env: testTemporaryDirectoryEnvironment,
          environment: 'node',
          globals: true,
          include: ['src/**/*.spec.ts'],
          name: 'unit',
        },
      },
      {
        test: {
          env: testTemporaryDirectoryEnvironment,
          environment: 'node',
          fileParallelism: false,
          globals: true,
          include: ['test/**/*.test.ts'],
          name: 'integration',
        },
      },
    ],
    reporters: ['agent', createTimingReporter()],
  },
});
