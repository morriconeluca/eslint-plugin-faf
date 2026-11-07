import { ESLint } from 'eslint';
import { performance } from 'node:perf_hooks';

import type { TChildMeasurementResult } from './benchmark.type.js';

import plugin from '../src/main.js';

const DEFAULT_ENTRY = 'src/_utils/fn-0/fn-0.util.ts';

const projectPath = process.argv[2];
const relativeEntry = process.argv[3] ?? DEFAULT_ENTRY;

const executeChildRun = async (): Promise<void> => {
  if (projectPath === undefined || projectPath.length === 0) {
    const failurePayload: TChildMeasurementResult = {
      elapsedMs: -1,
      ok: false,
    };
    process.stdout.write(JSON.stringify(failurePayload));
    return;
  }

  const eslint = new ESLint({
    cwd: projectPath,
    overrideConfig: [plugin.configs.recommended],
    overrideConfigFile: true,
  });

  const startTime = performance.now();
  await eslint.lintFiles([relativeEntry]);
  const elapsedMs = performance.now() - startTime;

  const resultPayload: TChildMeasurementResult = {
    elapsedMs,
    ok: true,
  };
  process.stdout.write(JSON.stringify(resultPayload));
};

await executeChildRun();
