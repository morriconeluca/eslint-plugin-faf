import { ESLint } from 'eslint';
import { execFileSync } from 'node:child_process';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { performance } from 'node:perf_hooks';

import type {
  TBenchmarkBudget,
  TBenchmarkResult,
  TChildMeasurementResult,
  TGeneratedProject,
} from './benchmark.type.js';

import plugin from '../src/main.js';
import { generateBenchmarkProject } from './project-generator.js';

const UTF8_ENCODING = 'utf8';
const CACHE_RELATIVE_PATH =
  'node_modules/.cache/eslint-plugin-faf/records.cache';
const SCRIPT_NAME = 'bench/child-runner.ts';
const HOOK_NAME = 'scripts/register-script-typescript.ts';

const COLD_BUDGET_MS = 1500;
const WARM_CACHE_BUDGET_MS = 300;
const OVERHEAD_BUDGET_MS = 0.2;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasChildResultFields = (record: Record<string, unknown>): boolean =>
  typeof record['elapsedMs'] === 'number' && typeof record['ok'] === 'boolean';

const isChildMeasurementResult = (
  value: unknown
): value is TChildMeasurementResult =>
  isObjectRecord(value) && hasChildResultFields(value);

const extractLastJsonLine = (text: string): string | undefined => {
  const lines = text.trim().split('\n');
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (line !== undefined && line.trimStart().startsWith('{')) {
      return line;
    }
  }
  return undefined;
};

const getRecordsCacheSize = (projectPath: string): number => {
  const cachePath = nodePath.join(projectPath, CACHE_RELATIVE_PATH);
  const hasCache = nodeFs.existsSync(cachePath);
  if (!hasCache) {
    return 0;
  }
  const stats = nodeFs.statSync(cachePath);
  return stats.size;
};

const createLinter = (projectPath: string): ESLint =>
  new ESLint({
    cwd: projectPath,
    overrideConfig: [plugin.configs.recommended],
    overrideConfigFile: true,
  });

const measureWarmPersistentCache = (project: TGeneratedProject): number => {
  const repositoryRoot = process.cwd();
  const runnerScript = nodePath.resolve(repositoryRoot, SCRIPT_NAME);
  const registerHook = nodePath.resolve(repositoryRoot, HOOK_NAME);

  const rawOutput = execFileSync(
    process.execPath,
    [
      '--import',
      registerHook,
      runnerScript,
      project.projectPath,
      project.entryFile,
    ],
    {
      cwd: repositoryRoot,
      encoding: UTF8_ENCODING,
    }
  );

  const jsonLine = extractLastJsonLine(rawOutput);
  if (jsonLine === undefined) {
    return -1;
  }

  const parsed: unknown = JSON.parse(jsonLine);
  if (!isChildMeasurementResult(parsed)) {
    return -1;
  }
  return parsed.ok ? parsed.elapsedMs : -1;
};

const evaluateBudgets = (
  coldMs: number,
  warmPersistentCacheMs: number,
  overheadPerFileMs: number
): readonly TBenchmarkBudget[] => [
  {
    budgetMs: COLD_BUDGET_MS,
    metric: 'Cold model construction',
    observedMs: coldMs,
    satisfied: coldMs <= COLD_BUDGET_MS,
  },
  {
    budgetMs: WARM_CACHE_BUDGET_MS,
    metric: 'Warm persistent cache',
    observedMs: warmPersistentCacheMs,
    satisfied: warmPersistentCacheMs <= WARM_CACHE_BUDGET_MS,
  },
  {
    budgetMs: OVERHEAD_BUDGET_MS,
    metric: 'In-session overhead per file',
    observedMs: overheadPerFileMs,
    satisfied: overheadPerFileMs <= OVERHEAD_BUDGET_MS,
  },
];

export const runBenchmark = async (
  logicalNodeCount: number
): Promise<TBenchmarkResult> => {
  const project = generateBenchmarkProject({ logicalNodeCount });
  try {
    const linter = createLinter(project.projectPath);

    const coldStartTime = performance.now();
    await linter.lintFiles([project.entryFile]);
    const coldMs = performance.now() - coldStartTime;

    const warmStartTime = performance.now();
    await linter.lintFiles([project.secondFile]);
    const warmInSessionMs = performance.now() - warmStartTime;

    const warmPersistentCacheMs = measureWarmPersistentCache(project);
    const recordsCacheSizeBytes = getRecordsCacheSize(project.projectPath);
    const overheadPerFileMs = warmInSessionMs;
    const budgets = evaluateBudgets(
      coldMs,
      warmPersistentCacheMs,
      overheadPerFileMs
    );

    return {
      budgets,
      coldMs,
      logicalNodeCount,
      overheadPerFileMs,
      recordsCacheSizeBytes,
      warmInSessionMs,
      warmPersistentCacheMs,
    };
  } finally {
    project.cleanup();
  }
};
