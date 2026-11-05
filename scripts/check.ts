import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import {
  readRepositoryChanges,
  selectPresentChangedFiles,
} from './changed-files.js';

const ESLINT_BIN = './node_modules/.bin/eslint';
const TSC_BIN = './node_modules/.bin/tsc';
const VITEST_BIN = './node_modules/.bin/vitest';
const ESLINT_GATE_ARGUMENTS = [
  '--cache',
  '--cache-location',
  '.cache/eslint/',
] as const;
const MISSING_STATUS_EXIT_CODE = 1;

export type TCheckDependencies = {
  readonly now: () => number;
  readonly runCommand: (request: TCommandRequest) => TCommandResult;
};

export type TCheckReport = {
  readonly exitCode: number;
  readonly lines: readonly string[];
  readonly steps: readonly TCheckStep[];
  readonly totalDurationMs: number;
};

export type TCheckStep = {
  readonly durationMs: number;
  readonly exitCode: number;
  readonly name: TCheckStepName;
  readonly outcome: TStepOutcome;
};

export type TCheckStepName = 'eslint' | 'fitness' | 'related' | 'types';

export type TCommandRequest = {
  readonly arguments: readonly string[];
  readonly executable: string;
};

export type TCommandResult = {
  readonly status: null | number;
};

export type TStepOutcome = 'failed' | 'nothing-to-check' | 'passed';

type TStepPlan = {
  readonly command: TCommandRequest | undefined;
  readonly name: TCheckStepName;
};

const TYPES_COMMAND: TCommandRequest = {
  arguments: ['--noEmit'],
  executable: TSC_BIN,
};

const FITNESS_COMMAND: TCommandRequest = {
  arguments: ['run', 'test/fitness'],
  executable: VITEST_BIN,
};

const isTypeScriptFile = (filePath: string): boolean =>
  filePath.endsWith('.ts');

const buildEslintCommand = (
  modifiedFiles: readonly string[]
): TCommandRequest | undefined => {
  const typeScriptFiles = modifiedFiles.filter((filePath) =>
    isTypeScriptFile(filePath)
  );
  if (typeScriptFiles.length === 0) {
    return undefined;
  }
  return {
    arguments: [...ESLINT_GATE_ARGUMENTS, ...typeScriptFiles],
    executable: ESLINT_BIN,
  };
};

const buildRelatedCommand = (
  modifiedFiles: readonly string[]
): TCommandRequest | undefined => {
  if (modifiedFiles.length === 0) {
    return undefined;
  }
  return {
    arguments: ['related', '--run', ...modifiedFiles],
    executable: VITEST_BIN,
  };
};

const planSteps = (modifiedFiles: readonly string[]): readonly TStepPlan[] => [
  { command: TYPES_COMMAND, name: 'types' },
  { command: buildEslintCommand(modifiedFiles), name: 'eslint' },
  { command: FITNESS_COMMAND, name: 'fitness' },
  { command: buildRelatedCommand(modifiedFiles), name: 'related' },
];

const formatDuration = (durationMs: number): string =>
  `${(durationMs / 1000).toFixed(2)}s`;

const formatOutcome = (outcome: TStepOutcome): string => {
  switch (outcome) {
    case 'failed': {
      return 'failed';
    }
    case 'nothing-to-check': {
      return 'nothing to check';
    }
    case 'passed': {
      return 'passed';
    }
  }
};

const formatStepLine = (step: TCheckStep): string =>
  `${step.name} ${formatDuration(step.durationMs)} ${formatOutcome(step.outcome)}`;

const skipStep = (name: TCheckStepName): TCheckStep => ({
  durationMs: 0,
  exitCode: 0,
  name,
  outcome: 'nothing-to-check',
});

const executeCommandStep = (
  name: TCheckStepName,
  command: TCommandRequest,
  dependencies: TCheckDependencies
): TCheckStep => {
  const startedAt = dependencies.now();
  const result = dependencies.runCommand(command);
  const durationMs = dependencies.now() - startedAt;
  const exitCode = result.status ?? MISSING_STATUS_EXIT_CODE;
  const outcome: TStepOutcome = exitCode === 0 ? 'passed' : 'failed';
  return { durationMs, exitCode, name, outcome };
};

const finish = (
  steps: readonly TCheckStep[],
  startedAt: number,
  dependencies: TCheckDependencies
): TCheckReport => {
  const totalDurationMs = dependencies.now() - startedAt;
  const failed = steps.find((step) => step.outcome === 'failed');
  const exitCode = failed === undefined ? 0 : failed.exitCode;
  return {
    exitCode,
    lines: [
      ...steps.map((step) => formatStepLine(step)),
      `total ${formatDuration(totalDurationMs)}`,
    ],
    steps,
    totalDurationMs,
  };
};

export const runCheck = (
  modifiedFiles: readonly string[],
  dependencies: TCheckDependencies
): TCheckReport => {
  const startedAt = dependencies.now();
  const steps: TCheckStep[] = [];
  for (const plan of planSteps(modifiedFiles)) {
    const step =
      plan.command === undefined
        ? skipStep(plan.name)
        : executeCommandStep(plan.name, plan.command, dependencies);
    steps.push(step);
    if (step.outcome === 'failed') {
      break;
    }
  }
  return finish(steps, startedAt, dependencies);
};

export const resolveModifiedFiles = (base: string): readonly string[] => {
  const changes = readRepositoryChanges(base);
  return selectPresentChangedFiles(changes.changedPaths, changes.presentFiles);
};

const runInheritedCommand = (request: TCommandRequest): TCommandResult => {
  const result = spawnSync(request.executable, [...request.arguments], {
    stdio: 'inherit',
  });
  return { status: result.status };
};

const main = (): void => {
  const base = process.argv[2] ?? 'main';
  const report = runCheck(resolveModifiedFiles(base), {
    now: () => performance.now(),
    runCommand: runInheritedCommand,
  });
  for (const line of report.lines) {
    console.log(line);
  }
  process.exit(report.exitCode);
};

const isDirectExecution = (): boolean => {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(entry).href;
};

if (isDirectExecution()) {
  main();
}
