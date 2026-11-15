import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import eslintConfig, { HOST_IO_BOUNDARY_FILES } from '../../eslint.config.js';

const fixtureRoot = path.resolve(
  import.meta.dirname,
  '../../src/_rules/conformity/_utils/role-purity-fixture'
);

const hostBoundaryFile = path.resolve(
  import.meta.dirname,
  '../../src/_rules/conformity/_utils/discover-config/discover-config.util.ts'
);

const ROLE_FIXTURE_SUFFIXES = [
  '.config.ts',
  '.constant.ts',
  '.mock.ts',
  '.norm.ts',
  '.rule.ts',
  '.schema.ts',
  '.spec.ts',
  '.store.ts',
  '.type.ts',
  '.util.ts',
] as const;

const eslint = new ESLint({
  ignore: false,
  overrideConfig: [
    ...eslintConfig,
    {
      rules: {
        'faf/conformity': 'off',
      },
    },
  ],
  overrideConfigFile: true,
});

const resolveFixturePath = (relativePath: string): string => {
  const dotIndex = relativePath.indexOf('.');
  const suffix = dotIndex === -1 ? '.ts' : relativePath.slice(dotIndex);
  return path.join(fixtureRoot, `case${suffix}`);
};

const writeFixture = (relativePath: string, content: string): string => {
  const fullPath = resolveFixturePath(relativePath);
  fs.writeFileSync(fullPath, content);
  return fullPath;
};

const lint = async (
  relativePath: string,
  content: string
): Promise<readonly string[]> => {
  const fullPath = writeFixture(relativePath, content);
  const results = await eslint.lintFiles([fullPath]);
  return (results[0]?.messages ?? [])
    .map((message) => message.ruleId)
    .filter((ruleId): ruleId is string => typeof ruleId === 'string');
};

const lintBoundaryFile = async (
  content: string
): Promise<readonly string[]> => {
  const results = await eslint.lintText(content, {
    filePath: hostBoundaryFile,
  });
  return (results[0]?.messages ?? [])
    .map((message) => message.ruleId)
    .filter((ruleId): ruleId is string => typeof ruleId === 'string');
};

const restricted = (ruleIds: readonly string[]): readonly string[] =>
  ruleIds.filter((ruleId) => ruleId.startsWith('no-restricted-'));

describe('role purity', { timeout: 30_000 }, () => {
  beforeAll(async () => {
    fs.rmSync(fixtureRoot, { force: true, recursive: true });
    fs.mkdirSync(fixtureRoot, { recursive: true });
    const warmupPaths = ROLE_FIXTURE_SUFFIXES.map((suffix) => {
      const fullPath = path.join(fixtureRoot, `case${suffix}`);
      fs.writeFileSync(
        fullPath,
        "import type { Stats } from 'node:fs';\n/**\n * Warmup type documentation.\n */\nexport type TWarmup = {\n  /**\n   * Warmup stats documentation.\n   */\n  readonly stats: Stats;\n};\n"
      );
      return fullPath;
    });
    await eslint.lintFiles(warmupPaths);
  }, 120_000);

  afterAll(() => {
    fs.rmSync(fixtureRoot, { force: true, recursive: true });
  });

  it('rejects node:fs in a non-boundary util', async () => {
    const errors = restricted(
      await lint(
        'read.util.ts',
        "import fs from 'node:fs';\nexport const read = (): string => fs.readFileSync('x', 'utf8');\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects fs in a non-boundary util', async () => {
    const errors = restricted(
      await lint(
        'read-fs.util.ts',
        "import fs from 'fs';\nexport const read = (): string => fs.readFileSync('x', 'utf8');\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects node:worker_threads in a non-boundary util', async () => {
    const errors = restricted(
      await lint(
        'worker.util.ts',
        "import { Worker } from 'node:worker_threads';\nexport const createWorker = (): Worker => new Worker('x');\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects worker_threads in a non-boundary util', async () => {
    const errors = restricted(
      await lint(
        'worker-bare.util.ts',
        "import { Worker } from 'worker_threads';\nexport const createWorker = (): Worker => new Worker('x');\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects node:child_process and child_process in a non-boundary util', async () => {
    const nodeChildErrors = restricted(
      await lint(
        'spawn.util.ts',
        "import { spawnSync } from 'node:child_process';\nexport const run = (): number => spawnSync('true').status ?? 0;\n"
      )
    );
    expect(nodeChildErrors).toContain('no-restricted-imports');

    const bareChildErrors = restricted(
      await lint(
        'spawn-bare.util.ts',
        "import { spawnSync } from 'child_process';\nexport const run = (): number => spawnSync('true').status ?? 0;\n"
      )
    );
    expect(bareChildErrors).toContain('no-restricted-imports');
  });

  it('rejects oxc-resolver in a non-boundary util', async () => {
    const errors = restricted(
      await lint(
        'resolve.util.ts',
        "import { ResolverFactory } from 'oxc-resolver';\nexport const createResolver = (): ResolverFactory => new ResolverFactory({});\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects the process global in non-boundary files across pure roles', async () => {
    for (const filename of [
      'pid.util.ts',
      'pid.norm.ts',
      'pid.store.ts',
      'pid.rule.ts',
      'pid.schema.ts',
      'pid.config.ts',
      'pid.constant.ts',
      'pid.mock.ts',
    ]) {
      const errors = restricted(
        await lint(filename, 'export const pid = process.pid;\n')
      );
      expect(errors).toContain('no-restricted-globals');
      expect(errors).toContain('no-restricted-properties');
    }
  });

  it('rejects node:fs in pure roles such as norm, schema, config, constant, store, rule, and mock', async () => {
    for (const filename of [
      'check.norm.ts',
      'parse.schema.ts',
      'local.config.ts',
      'limit.constant.ts',
      'state.store.ts',
      'check.rule.ts',
      'sample.mock.ts',
    ]) {
      const errors = restricted(
        await lint(
          filename,
          "import fs from 'node:fs';\nexport const value = fs.existsSync('x');\n"
        )
      );
      expect(errors).toContain('no-restricted-imports');
    }
  });

  it('allows host I/O effects and process in a declared host I/O boundary file', async () => {
    const errors = restricted(
      await lintBoundaryFile(
        "import fs from 'node:fs';\nimport { Worker } from 'node:worker_threads';\nimport { ResolverFactory } from 'oxc-resolver';\nexport function readFile(): string {\n  return fs.readFileSync('x', 'utf8') + String(process.pid) + String(new Worker('x')) + String(new ResolverFactory({}));\n}\n"
      )
    );
    expect(errors).toEqual([]);
  });

  it('forbids node:child_process and child_process even in declared host I/O boundary files', async () => {
    const nodeChildErrors = restricted(
      await lintBoundaryFile(
        "import { spawnSync } from 'node:child_process';\nexport const run = (): number => spawnSync('true').status ?? 0;\n"
      )
    );
    expect(nodeChildErrors).toContain('no-restricted-imports');

    const bareChildErrors = restricted(
      await lintBoundaryFile(
        "import { spawnSync } from 'child_process';\nexport const run = (): number => spawnSync('true').status ?? 0;\n"
      )
    );
    expect(bareChildErrors).toContain('no-restricted-imports');
  });

  it('allows a pure util with no effect import', async () => {
    const errors = restricted(
      await lint(
        'add.util.ts',
        'export const add = (left: number, right: number): number => left + right;\n'
      )
    );
    expect(errors).toEqual([]);
  });

  it('allows node:fs in a spec', async () => {
    const errors = restricted(
      await lint(
        'read.spec.ts',
        "import fs from 'node:fs';\nexport const read = (): string => fs.readFileSync('x', 'utf8');\n"
      )
    );
    expect(errors).toEqual([]);
  });

  it('requires every HOST_IO_BOUNDARY_FILES entry to exist on disk and use a restricted host effect or process', () => {
    const repositoryRoot = path.resolve(import.meta.dirname, '../..');
    const hostEffectPattern =
      /from\s+['"](?:node:fs|fs|node:worker_threads|worker_threads|oxc-resolver)['"]|\bprocess\b/;
    const invalidEntries = HOST_IO_BOUNDARY_FILES.filter((relativePath) => {
      const fullPath = path.resolve(repositoryRoot, relativePath);
      if (!fs.existsSync(fullPath)) {
        return true;
      }
      const source = fs.readFileSync(fullPath, 'utf8');
      return !hostEffectPattern.test(source);
    });
    expect(invalidEntries).toEqual([]);
  });
});
