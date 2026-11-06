import { createFixture } from 'fs-fixture';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkMutationThreshold } from '../../scripts/check-mutation-threshold.js';
import {
  resolveDiffBase,
  resolveRunParameters,
} from '../../scripts/mutate-diff.js';

const GIT = '/usr/bin/git';

const runGit = (cwd: string, gitArguments: readonly string[]): void => {
  expect(
    spawnSync(GIT, [...gitArguments], { cwd, encoding: 'utf8' }).status
  ).toBe(0);
};

const initRepository = (cwd: string): void => {
  for (const gitArguments of [
    ['init', '-b', 'main'],
    ['config', 'user.name', 'test'],
    ['config', 'user.email', 'test@test.com'],
    ['add', '.'],
    ['commit', '-m', 'initial'],
  ]) {
    runGit(cwd, gitArguments);
  }
};

const runScriptProcess = (
  cwd: string,
  cliArguments: readonly string[],
  environment: Record<string, string | undefined>
): { readonly status: null | number; readonly stdout: string } => {
  const registerScript = path.resolve(
    import.meta.dirname,
    '../../scripts/register-script-typescript.ts'
  );
  const mutateDiffScript = path.resolve(
    import.meta.dirname,
    '../../scripts/mutate-diff.ts'
  );
  const executionResult = spawnSync(
    process.execPath,
    ['--import', registerScript, mutateDiffScript, ...cliArguments],
    { cwd, encoding: 'utf8', env: { ...process.env, ...environment } }
  );
  return { status: executionResult.status, stdout: executionResult.stdout };
};

const sampleReportPayload = JSON.stringify({
  files: {
    'src/test.ts': {
      language: 'typescript',
      mutants: [
        {
          id: '1',
          location: {
            end: { column: 5, line: 1 },
            start: { column: 1, line: 1 },
          },
          mutatorName: 'BlockStatement',
          replacement: '{}',
          status: 'Killed',
        },
      ],
      source: 'export const a = 1;',
    },
  },
  schemaVersion: '1.0',
});

describe('resolveDiffBase and resolveRunParameters (P1 wiring & precedence)', () => {
  it('resolves explicit argument, CI env var, or fallback main by precedence', () => {
    expect(resolveDiffBase('target-ref', 'ci-ref')).toBe('target-ref');
    expect(resolveDiffBase(undefined, 'ci-ref')).toBe('ci-ref');
    expect(resolveDiffBase('', 'ci-ref')).toBe('ci-ref');
    expect(resolveDiffBase()).toBe('main');
  });

  it('keeps diff mode when user passes "force" or "incremental" as branch ref', () => {
    expect(resolveRunParameters(['--mode=diff', 'force'])).toEqual({
      base: 'force',
      mode: 'diff',
    });
    expect(resolveRunParameters(['--mode=diff', 'incremental'])).toEqual({
      base: 'incremental',
      mode: 'diff',
    });
    expect(resolveRunParameters(['--mode=force']).mode).toBe('force');
    expect(resolveRunParameters(['--mode=incremental']).mode).toBe(
      'incremental'
    );
  });

  it('rejects overriding mode with a second --mode flag (F2 case 4)', () => {
    const conflicting = resolveRunParameters(['--mode=diff', '--mode=force']);
    expect(conflicting.error).toContain('Cannot specify multiple --mode flags');
    expect(conflicting.mode).toBe('diff');
  });

  it('rejects unknown options starting with "--" and does not fallback to main (F2 case 5)', () => {
    expect(
      resolveRunParameters(['--mode=diff', '--invalid-base']).error
    ).toContain('Unknown option');
    expect(
      resolveRunParameters(['--mode=diff', '--name-only']).error
    ).toBeDefined();
    expect(resolveRunParameters(['--mode=invalid']).error).toBeDefined();
    expect(
      resolveRunParameters(['--mode=diff', 'main', 'feature']).error
    ).toBeDefined();
    expect(
      resolveRunParameters(['--mode=force', 'origin/main']).error
    ).toBeDefined();
  });
});

describe('mutate-diff in isolated git repository (P1 execution)', () => {
  it('handles empty diff with explicit message and exit code zero', async () => {
    const fixture = await createFixture({ 'README.md': 'sample' });
    try {
      initRepository(fixture.path);
      const outcome = runScriptProcess(fixture.path, ['--mode=diff'], {
        FAF_DIFF_BASE: 'main',
      });
      expect(outcome.status).toBe(0);
      expect(outcome.stdout).toContain(
        'No source files to mutate for the current diff'
      );
    } finally {
      await fixture.rm();
    }
  });

  it('fails with non-zero status when given an invalid base reference or flags', async () => {
    const fixture = await createFixture({ 'README.md': 'sample' });
    try {
      initRepository(fixture.path);
      for (const flags of [
        ['--mode=diff', 'non-existent-base-ref'],
        ['--mode=diff', '--invalid-base'],
        ['--mode=diff', '--mode=force'],
        ['--mode=diff', '--quiet'],
      ]) {
        expect(runScriptProcess(fixture.path, flags, {}).status).not.toBe(0);
      }
    } finally {
      await fixture.rm();
    }
  });

  it('preserves git index staging without modifying index', async () => {
    const fixture = await createFixture({
      'README.md': 'sample',
      'src/file.ts': 'export const value = 1;\n',
    });
    try {
      initRepository(fixture.path);
      const readStage = (): string =>
        spawnSync(GIT, ['ls-files', '--stage'], {
          cwd: fixture.path,
          encoding: 'utf8',
        }).stdout;
      const stageBefore = readStage();
      runScriptProcess(fixture.path, ['--mode=diff', 'main'], {});
      expect(readStage()).toBe(stageBefore);
    } finally {
      await fixture.rm();
    }
  });
});

describe('checkMutationThreshold (offline archive evaluation)', () => {
  it('evaluates valid report offline and exits with 0', async () => {
    const fixture = await createFixture({
      'reports/valid.json': sampleReportPayload,
    });
    try {
      const evaluationOutcome = checkMutationThreshold([
        path.join(fixture.path, 'reports/valid.json'),
      ]);
      expect(
        evaluationOutcome.isPassed && evaluationOutcome.exitCode === 0
      ).toBe(true);
      expect(evaluationOutcome.evaluation?.overallCounts.total).toBe(1);
    } finally {
      await fixture.rm();
    }
  });

  it('fails with exit code 1 when report file does not exist', () => {
    const evaluationOutcome = checkMutationThreshold(['missing-file.json']);
    expect(evaluationOutcome.isPassed).toBe(false);
    expect(evaluationOutcome.exitCode).toBe(1);
  });

  it('always declares offline evaluation even if a run manifest exists', async () => {
    const fixture = await createFixture({
      'reports/mutation/mutation.json': sampleReportPayload,
      'reports/mutation/run-manifest.json': JSON.stringify({
        command: 'npm run gate:4:diff',
        mode: 'diff',
      }),
    });
    try {
      const evaluationOutcome = checkMutationThreshold([
        path.join(fixture.path, 'reports/mutation/mutation.json'),
      ]);
      expect(
        evaluationOutcome.isPassed && evaluationOutcome.exitCode === 0
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });
});
