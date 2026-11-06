import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { TMutationEvaluationResult } from './mutation-types.js';

import { evaluateMutationReport } from './mutation-evaluator.js';
import { formatEvaluationReport } from './mutation-formatter.js';

export const THRESHOLD = 80;

export type TCheckThresholdResult = {
  readonly evaluation?: TMutationEvaluationResult;
  readonly exitCode: number;
  readonly isPassed: boolean;
};

const DEFAULT_REPORT = 'reports/mutation/mutation.json';

const parseReportPath = (rawArguments: readonly string[]): string => {
  for (const argument of rawArguments) {
    if (!argument.startsWith('--')) {
      return argument;
    }
  }
  return DEFAULT_REPORT;
};

export const checkMutationThreshold = (
  argumentsList: readonly string[] = []
): TCheckThresholdResult => {
  const reportPath = parseReportPath(argumentsList);
  const resolved = path.resolve(process.cwd(), reportPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: Mutation report not found at ${resolved}`);
    return { exitCode: 1, isPassed: false };
  }

  console.log(
    '[MUTATION CHECKER] Offline evaluation mode: inspecting stored report without run verification.'
  );
  console.log(
    '[MUTATION CHECKER] Notice: This offline evaluation does NOT constitute a certified fresh measurement run.'
  );

  const raw = fs.readFileSync(resolved, 'utf8');
  const evaluation = evaluateMutationReport(raw, {
    mode: 'offline',
    threshold: THRESHOLD,
  });

  console.log(formatEvaluationReport(evaluation, THRESHOLD));

  return {
    evaluation,
    exitCode: evaluation.isPassed ? 0 : 1,
    isPassed: evaluation.isPassed,
  };
};

const isDirectExecution = (): boolean => {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
};

if (isDirectExecution()) {
  const result = checkMutationThreshold(process.argv.slice(2));
  process.exit(result.exitCode);
}
