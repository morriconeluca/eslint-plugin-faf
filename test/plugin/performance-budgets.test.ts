import { ESLint } from 'eslint';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import { runBenchmark } from '../../bench/measure.js';
import { generateBenchmarkProject } from '../../bench/project-generator.js';
import plugin from '../../src/main.js';

const CACHE_RELATIVE_PATH =
  'node_modules/.cache/eslint-plugin-faf/records.cache';
const SMALL_SCALE = 100;
const BENCHMARK_SCALE = 100;
const BENCHMARK_TIMEOUT_MS = 60_000;

describe('performance budgets', () => {
  it(
    'verifies cold and warm performance on a synthetic conforming FAF project',
    async () => {
      const project = generateBenchmarkProject({
        logicalNodeCount: SMALL_SCALE,
      });

      try {
        expect(project.logicalNodeCount).toBe(SMALL_SCALE);
        expect(nodeFs.existsSync(project.projectPath)).toBe(true);

        const linter = new ESLint({
          cwd: project.projectPath,
          overrideConfig: [plugin.configs.recommended],
          overrideConfigFile: true,
        });

        const coldStart = performance.now();
        const coldResults = await linter.lintFiles([project.entryFile]);
        const coldDurationMs = performance.now() - coldStart;

        const reportedMessages = coldResults.flatMap((r) => r.messages);
        expect(reportedMessages).toHaveLength(0);
        expect(coldDurationMs).toBeGreaterThan(0);

        const cacheFilePath = nodePath.join(
          project.projectPath,
          CACHE_RELATIVE_PATH
        );
        const hasCache = nodeFs.existsSync(cacheFilePath);
        expect(hasCache).toBe(true);

        const cacheSizeBytes = nodeFs.statSync(cacheFilePath).size;
        expect(cacheSizeBytes).toBeGreaterThan(0);

        const warmStart = performance.now();
        const warmResults = await linter.lintFiles([project.secondFile]);
        const warmDurationMs = performance.now() - warmStart;

        const warmMessages = warmResults.flatMap((r) => r.messages);
        expect(warmMessages).toHaveLength(0);
        expect(warmDurationMs).toBeGreaterThan(0);
        expect(warmDurationMs).toBeLessThan(coldDurationMs);
      } finally {
        project.cleanup();
      }
    },
    BENCHMARK_TIMEOUT_MS
  );

  it(
    'evaluates performance metrics and budgets on a 1k logical node project',
    async () => {
      const result = await runBenchmark(BENCHMARK_SCALE);

      expect(result.logicalNodeCount).toBe(BENCHMARK_SCALE);
      expect(result.coldMs).toBeGreaterThan(0);
      expect(result.coldMs).toBeLessThanOrEqual(1500);
      expect(result.warmInSessionMs).toBeGreaterThan(0);
      expect(result.warmPersistentCacheMs).toBeGreaterThan(0);
      expect(result.recordsCacheSizeBytes).toBeGreaterThan(0);
      expect(result.budgets).toHaveLength(3);

      const coldBudget = result.budgets.find(
        (b) => b.metric === 'Cold model construction'
      );
      expect(coldBudget?.satisfied).toBe(true);
    },
    BENCHMARK_TIMEOUT_MS
  );
});
