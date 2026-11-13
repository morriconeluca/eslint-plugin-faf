import { createFixture } from 'fs-fixture';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  INCREMENTAL_CACHE_FILE,
  type TMutationRunMode,
  type TSpawnExecutor,
} from '../../scripts/mutation-runner-types.js';
import { runMutationMeasure } from '../../scripts/mutation-runner.js';

const mockSpawn =
  (
    effect: (arguments_: readonly string[]) => {
      signal?: null | string;
      status: null | number;
    }
  ): TSpawnExecutor =>
  (_executable, arguments_) =>
    effect(arguments_);

const runGit = (gitArguments: readonly string[], cwd: string): void => {
  spawnSync('/usr/bin/git', [...gitArguments], { cwd, encoding: 'utf8' });
};

const makeReport = (id: string, source = 'export const x = 1;\n') => ({
  language: 'typescript',
  mutants: [
    {
      id,
      location: { end: { column: 5, line: 1 }, start: { column: 1, line: 1 } },
      mutatorName: 'BlockStatement',
      replacement: '{}',
      status: 'Killed',
    },
  ],
  source,
});

const TEST_VERSIONS = {
  node: 'v24.0.0',
  strykerCore: '10.1.1',
  strykerRunner: '10.1.1',
  vitest: '3.0.0',
};

const setupReportAndPlan = (
  root: string,
  files?: Record<string, unknown>
): void => {
  const reportFiles = files ?? { 'src/foo/bar.util.ts': makeReport('1') };
  const reportPath = path.join(root, 'reports/mutation/mutation.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ files: reportFiles, schemaVersion: '1.0' })
  );
  const eventDirectory = path.join(root, 'reports/mutation/events');
  fs.mkdirSync(eventDirectory, { recursive: true });
  const mutant = {
    fileName: path.resolve(root, 'src/foo/bar.util.ts'),
    id: '1',
    location: { end: { column: 4, line: 0 }, start: { column: 0, line: 0 } },
    mutatorName: 'BlockStatement',
    replacement: '{}',
  };
  fs.writeFileSync(
    path.join(eventDirectory, '00001-onMutationTestingPlanReady.json'),
    JSON.stringify({ mutantPlans: [{ mutant, plan: 'Run' }] })
  );
};

const withFixture = async (
  tree: Record<string, string>,
  testFunction: (fixtureDirectory: string) => Promise<void> | void
): Promise<void> => {
  const fixture = await createFixture(tree);
  try {
    await testFunction(fixture.path);
  } finally {
    await fixture.rm();
  }
};

const runMeasure = (
  cwd: string,
  spawnImpl: TSpawnExecutor,
  mode: TMutationRunMode = 'force',
  base?: string
) =>
  runMutationMeasure({
    base,
    cwd,
    isTestContext: true,
    manifestPath: path.join(cwd, 'reports/mutation/run-manifest.json'),
    mode,
    reportPath: path.join(cwd, 'reports/mutation/mutation.json'),
    spawnSyncImpl: spawnImpl,
    testVersions: TEST_VERSIONS,
  });

const checkRunArtifacts = (
  runDirectoryPath: string,
  manifest?: { artifacts?: { plan?: unknown; report?: unknown } }
): void => {
  const runs = path.join(runDirectoryPath, 'reports/mutation/runs');
  const runId = fs
    .readdirSync(runs)
    .find((name) => !name.startsWith('archived-'));
  expect(runId).toBeDefined();
  for (const fileName of ['mutation.json', 'plan.json', 'run-manifest.json']) {
    const filePath = path.join(runs, String(runId), fileName);
    expect(fs.existsSync(filePath)).toBe(true);
  }
  expect(manifest?.artifacts?.report).toBeDefined();
  expect(manifest?.artifacts?.plan).toBeDefined();
};

const initRepository = (directory: string): void => {
  for (const gitArguments of [
    ['init', '-b', 'main'],
    ['config', 'user.name', 'test'],
    ['config', 'user.email', 'test@test.com'],
    ['add', '.'],
    ['commit', '-m', 'initial'],
  ]) {
    runGit(gitArguments, directory);
  }
};

describe('mutation-runner execution modes and report freshness', () => {
  it.each([
    ['force' as const, ['run', '--force'], 'npm run gate:4:force', true],
    [
      'incremental' as const,
      ['run', '--incremental', '--incrementalFile', INCREMENTAL_CACHE_FILE],
      'npm run gate:4:incremental',
      false,
    ],
  ])(
    'runs %s mode with expected args and initialCacheHash',
    async (mode, expectedArguments, expectedCommand, expectedForce) => {
      await withFixture(
        {
          [INCREMENTAL_CACHE_FILE]: JSON.stringify({ files: {} }),
          'src/foo/bar.util.ts': 'export const x = 1;\n',
        },
        (fixtureDirectory) => {
          const capturedArguments: string[] = [];
          const executor = mockSpawn((spawnArguments) => {
            capturedArguments.push(...spawnArguments);
            setupReportAndPlan(fixtureDirectory);
            return { status: 0 };
          });
          const measureResult = runMeasure(fixtureDirectory, executor, mode);
          expect(measureResult.isPassed).toBe(true);
          expect(measureResult.exitCode).toBe(0);
          expect(capturedArguments).toEqual(expectedArguments);
          expect(measureResult.manifest?.command).toBe(expectedCommand);
          expect(measureResult.manifest?.reuseState.force).toBe(expectedForce);
          expect(measureResult.manifest?.initialCacheHash).not.toBeNull();
          checkRunArtifacts(fixtureDirectory, measureResult.manifest);
        }
      );
    }
  );

  it('fails when report exists beforehand and substitute spawn does not write a fresh report', async () => {
    await withFixture(
      { 'src/foo/bar.util.ts': 'export const x = 1;\n' },
      (fixtureDirectory) => {
        setupReportAndPlan(fixtureDirectory);
        const measureResult = runMeasure(
          fixtureDirectory,
          mockSpawn(() => ({ status: 0 }))
        );
        expect(measureResult.isPassed).toBe(false);
        expect(measureResult.exitCode).not.toBe(0);
        expect(measureResult.status).toBe('failed');
      }
    );
  });

  it('fails with explicit error when initial diff cache is corrupted without silencing it', async () => {
    await withFixture(
      {
        '.cache/stryker/diff.json': '{ bad json',
        'src/foo/bar.util.ts': 'export const x = 1;\n',
      },
      (fixtureDirectory) => {
        initRepository(fixtureDirectory);
        fs.writeFileSync(
          path.join(fixtureDirectory, 'src/foo/bar.util.ts'),
          'export const x = 2;\n'
        );
        const measureResult = runMeasure(
          fixtureDirectory,
          mockSpawn(() => ({ status: 0 })),
          'diff'
        );
        expect(measureResult.isPassed).toBe(false);
        expect(measureResult.exitCode).toBe(1);
        expect(measureResult.errorMessage).toContain(
          'Failed to parse initial cache file'
        );
      }
    );
  });

  it('runs diff mode in an isolated git repository with custom working directory, cache, and historical files', async () => {
    const oldMutant = {
      id: 'old-1',
      location: { end: { column: 5, line: 1 }, start: { column: 1, line: 1 } },
      mutatorName: 'BlockStatement',
      replacement: '{}',
    };
    await withFixture(
      {
        '.cache/stryker/diff.json': JSON.stringify({
          files: { 'src/old.ts': { mutants: [oldMutant] } },
        }),
        'src/foo/bar.util.ts': 'export const x = 1;\n',
      },
      (fixtureDirectory) => {
        initRepository(fixtureDirectory);
        fs.writeFileSync(
          path.join(fixtureDirectory, 'src/foo/bar.util.ts'),
          'export const x = 2;\n'
        );
        const capturedArguments: string[] = [];
        const executor = mockSpawn((spawnArguments) => {
          capturedArguments.push(...spawnArguments);
          setupReportAndPlan(fixtureDirectory, {
            'src/foo/bar.util.ts': makeReport('1', 'export const x = 2;\n'),
            'src/old.ts': makeReport('old-1'),
          });
          return { status: 0 };
        });
        const measureResult = runMeasure(
          fixtureDirectory,
          executor,
          'diff',
          'main'
        );
        expect(measureResult.isPassed).toBe(true);
        expect(capturedArguments).toContain('--incremental');
        expect(capturedArguments).toContain('--force');
        expect(
          measureResult.evaluation?.historicalFiles['src/old.ts']
        ).toBeDefined();
        expect(measureResult.manifest?.initialCacheHash).not.toBeNull();
      }
    );
  });
});

describe('mutation-runner missing plan verification', () => {
  it('fails when mutation plan event is missing', async () => {
    await withFixture(
      { 'src/foo/bar.util.ts': 'export const x = 1;\n' },
      (fixtureDirectory) => {
        const missingPlanResult = runMeasure(
          fixtureDirectory,
          mockSpawn(() => {
            setupReportAndPlan(fixtureDirectory);
            fs.rmSync(path.join(fixtureDirectory, 'reports/mutation/events'), {
              force: true,
              recursive: true,
            });
            return { status: 0 };
          })
        );
        expect(missingPlanResult.isPassed).toBe(false);
        expect(missingPlanResult.errorMessage).toContain('plan');
      }
    );
  });
});

describe('mutation-runner process failures and input integrity', () => {
  it('fails on process termination signal', async () => {
    await withFixture(
      { 'src/foo/bar.util.ts': 'export const x = 1;\n' },
      (fixtureDirectory) => {
        const signalResult = runMeasure(
          fixtureDirectory,
          mockSpawn(() => ({ signal: 'SIGTERM', status: null }))
        );
        expect(signalResult.isPassed).toBe(false);
        expect(signalResult.errorMessage).toContain('SIGTERM');
      }
    );
  });

  it('detects tampering in test/acceptance files during a mutation run', async () => {
    await withFixture(
      {
        'src/foo/bar.util.ts': 'export const x = 1;\n',
        'test/acceptance/example.test.ts': 'export const val = 1;\n',
      },
      (fixtureDirectory) => {
        const tamperingResult = runMeasure(
          fixtureDirectory,
          mockSpawn(() => {
            fs.writeFileSync(
              path.join(fixtureDirectory, 'test/acceptance/example.test.ts'),
              'export const val = 2;\n'
            );
            setupReportAndPlan(fixtureDirectory);
            return { status: 0 };
          })
        );
        expect(tamperingResult.isPassed).toBe(false);
        expect(tamperingResult.errorMessage).toContain(
          'test/acceptance/example.test.ts'
        );
      }
    );
  });
});
