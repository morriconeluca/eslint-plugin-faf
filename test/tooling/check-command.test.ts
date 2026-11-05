import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import type {
  TCheckDependencies,
  TCommandRequest,
} from '../../scripts/check.js';

import { runCheck } from '../../scripts/check.js';

type THarness = {
  readonly dependencies: TCheckDependencies;
  readonly requests: TCommandRequest[];
};

const createHarness = (statuses: readonly (null | number)[]): THarness => {
  const requests: TCommandRequest[] = [];
  let time = 0;
  let statusIndex = 0;
  return {
    dependencies: {
      now: () => time,
      runCommand: (request) => {
        requests.push(request);
        time += 1500;
        const status = statuses[statusIndex];
        statusIndex += 1;
        return { status: status === undefined ? 0 : status };
      },
    },
    requests,
  };
};

describe('check command loading', () => {
  it('loads the shared changed-file selection when node runs the command', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        './scripts/register-script-typescript.ts',
        '--eval',
        "import { resolveModifiedFiles } from './scripts/check.ts'; if (typeof resolveModifiedFiles !== 'function') process.exit(2);",
      ],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
  });
});

describe('runCheck', () => {
  it('runs types and fitness and states that lint and related have nothing to check when no file changed', () => {
    const harness = createHarness([0, 0]);
    const report = runCheck([], harness.dependencies);

    expect(harness.requests).toEqual([
      {
        arguments: ['--noEmit'],
        executable: './node_modules/.bin/tsc',
      },
      {
        arguments: ['run', 'test/fitness'],
        executable: './node_modules/.bin/vitest',
      },
    ]);
    expect(report.exitCode).toBe(0);
    expect(report.lines).toEqual([
      'types 1.50s passed',
      'eslint 0.00s nothing to check',
      'fitness 1.50s passed',
      'related 0.00s nothing to check',
      'total 3.00s',
    ]);
  });

  it('lints changed TypeScript files with the gate:2 options and runs related tests without coverage', () => {
    const harness = createHarness([0, 0, 0, 0]);
    const report = runCheck(
      ['README.md', 'src/b.spec.ts', 'src/a.ts'],
      harness.dependencies
    );

    expect(harness.requests).toEqual([
      {
        arguments: ['--noEmit'],
        executable: './node_modules/.bin/tsc',
      },
      {
        arguments: [
          '--cache',
          '--cache-location',
          '.cache/eslint/',
          'src/b.spec.ts',
          'src/a.ts',
        ],
        executable: './node_modules/.bin/eslint',
      },
      {
        arguments: ['run', 'test/fitness'],
        executable: './node_modules/.bin/vitest',
      },
      {
        arguments: [
          'related',
          '--run',
          'README.md',
          'src/b.spec.ts',
          'src/a.ts',
        ],
        executable: './node_modules/.bin/vitest',
      },
    ]);
    expect(report.exitCode).toBe(0);
    expect(report.lines[1]).toBe('eslint 1.50s passed');
    expect(report.lines[3]).toBe('related 1.50s passed');
  });

  it('states that lint has nothing to check when no changed file is TypeScript', () => {
    const harness = createHarness([0, 0, 0]);
    const report = runCheck(['README.md'], harness.dependencies);

    expect(harness.requests.map((request) => request.executable)).toEqual([
      './node_modules/.bin/tsc',
      './node_modules/.bin/vitest',
      './node_modules/.bin/vitest',
    ]);
    expect(harness.requests[2]?.arguments).toEqual([
      'related',
      '--run',
      'README.md',
    ]);
    expect(report.lines[1]).toBe('eslint 0.00s nothing to check');
  });

  it('stops at the first failed step and returns that step exit code', () => {
    const typeFailure = createHarness([2]);
    const typeReport = runCheck(['src/a.ts'], typeFailure.dependencies);
    expect(typeFailure.requests).toEqual([
      {
        arguments: ['--noEmit'],
        executable: './node_modules/.bin/tsc',
      },
    ]);
    expect(typeReport.exitCode).toBe(2);
    expect(typeReport.lines).toEqual(['types 1.50s failed', 'total 1.50s']);

    const lintFailure = createHarness([0, 1]);
    const lintReport = runCheck(['src/a.ts'], lintFailure.dependencies);
    expect(lintFailure.requests).toHaveLength(2);
    expect(lintReport.exitCode).toBe(1);
    expect(lintReport.steps.map((step) => step.name)).toEqual([
      'types',
      'eslint',
    ]);

    const fitnessFailure = createHarness([0, 0, 7]);
    const fitnessReport = runCheck(['src/a.ts'], fitnessFailure.dependencies);
    expect(fitnessFailure.requests).toHaveLength(3);
    expect(fitnessReport.exitCode).toBe(7);
    expect(fitnessReport.steps.map((step) => step.name)).toEqual([
      'types',
      'eslint',
      'fitness',
    ]);

    const relatedFailure = createHarness([0, 0, 0, 4]);
    const relatedReport = runCheck(['src/a.ts'], relatedFailure.dependencies);
    expect(relatedFailure.requests).toHaveLength(4);
    expect(relatedReport.exitCode).toBe(4);
    expect(relatedReport.lines[3]).toBe('related 1.50s failed');
  });

  it('treats a missing process status as failure and does not continue', () => {
    const harness = createHarness([null]);
    const report = runCheck(['src/a.ts'], harness.dependencies);

    expect(report.exitCode).toBe(1);
    expect(report.lines[0]).toBe('types 1.50s failed');
    expect(harness.requests).toHaveLength(1);
  });
});
