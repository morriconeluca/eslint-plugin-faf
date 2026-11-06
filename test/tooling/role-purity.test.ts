import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const fixtureRoot = path.resolve(
  import.meta.dirname,
  '../../src/_rules/conformity/_utils/role-purity-fixture'
);

const eslint = new ESLint({ ignore: false });

const writeFixture = (relativePath: string, content: string): string => {
  const fullPath = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
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

const restricted = (ruleIds: readonly string[]): readonly string[] =>
  ruleIds.filter((ruleId) => ruleId.startsWith('no-restricted-'));

describe('role purity', () => {
  beforeAll(async () => {
    await eslint.lintFiles(['src/main.ts']);
  }, 120_000);

  afterAll(() => {
    fs.rmSync(fixtureRoot, { force: true, recursive: true });
  });

  it('rejects node:fs in a util', async () => {
    const errors = restricted(
      await lint(
        'read.util.ts',
        "import fs from 'node:fs';\nexport const read = (): string => fs.readFileSync('x', 'utf8');\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects fs in a util', async () => {
    const errors = restricted(
      await lint(
        'read-fs.util.ts',
        "import fs from 'fs';\nexport const read = (): string => fs.readFileSync('x', 'utf8');\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects node:worker_threads in a util', async () => {
    const errors = restricted(
      await lint(
        'worker.util.ts',
        "import { Worker } from 'node:worker_threads';\nexport const createWorker = (): Worker => new Worker('x');\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects worker_threads in a util', async () => {
    const errors = restricted(
      await lint(
        'worker-bare.util.ts',
        "import { Worker } from 'worker_threads';\nexport const createWorker = (): Worker => new Worker('x');\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects node:child_process in a util', async () => {
    const errors = restricted(
      await lint(
        'spawn.util.ts',
        "import { spawnSync } from 'node:child_process';\nexport const run = (): number => spawnSync('true').status ?? 0;\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects child_process in a util', async () => {
    const errors = restricted(
      await lint(
        'spawn-bare.util.ts',
        "import { spawnSync } from 'child_process';\nexport const run = (): number => spawnSync('true').status ?? 0;\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects oxc-resolver in a util', async () => {
    const errors = restricted(
      await lint(
        'resolve.util.ts',
        "import { ResolverFactory } from 'oxc-resolver';\nexport const createResolver = (): ResolverFactory => new ResolverFactory({});\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects the process global in a util', async () => {
    const errors = restricted(
      await lint('pid.util.ts', 'export const pid = process.pid;\n')
    );
    expect(errors).toContain('no-restricted-globals');
    expect(errors).toContain('no-restricted-properties');
  });

  it('rejects an adapter import from a util', async () => {
    const errors = restricted(
      await lint(
        'pure.util.ts',
        "import { effect } from './_adapters/effect/index.js';\nexport const value = effect;\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects an adapter import from a schema', async () => {
    const errors = restricted(
      await lint(
        'parse.schema.ts',
        "import { effect } from '../_adapters/effect/index.js';\nexport function parse(value: unknown): unknown { return effect ?? value; }\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects an adapter import from a norm', async () => {
    const errors = restricted(
      await lint(
        'check.norm.ts',
        "import { effect } from '../_adapters/effect/index.js';\nexport const check = (): unknown => effect;\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects an adapter import from a config', async () => {
    const errors = restricted(
      await lint(
        'local.config.ts',
        "import { effect } from '../_adapters/effect/index.js';\nexport const local = effect;\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects an adapter import from a constant', async () => {
    const errors = restricted(
      await lint(
        'limit.constant.ts',
        "import { effect } from '../_adapters/effect/index.js';\nexport const LIMIT = effect;\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects an adapter import from a type', async () => {
    const errors = restricted(
      await lint(
        'payload.type.ts',
        "import type { TEffect } from '../_adapters/effect/index.js';\n/**\n * Payload carried by a pure type file.\n */\nexport type TPayload = {\n  /**\n   * Effect type that a pure file must not import.\n   */\n  readonly effect: TEffect;\n};\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('rejects an adapter import from a mock', async () => {
    const errors = restricted(
      await lint(
        'sample.mock.ts',
        "import { effect } from '../_adapters/effect/index.js';\nexport const sample = effect;\n"
      )
    );
    expect(errors).toContain('no-restricted-imports');
  });

  it('allows effect imports and process in an adapter', async () => {
    const errors = restricted(
      await lint(
        'read.adapter.ts',
        "import fs from 'node:fs';\nimport { Worker } from 'node:worker_threads';\nimport { spawnSync } from 'node:child_process';\nimport { ResolverFactory } from 'oxc-resolver';\nimport { readSibling } from './_adapters/sibling/index.js';\nexport function readFile(): string {\n  return fs.readFileSync('x', 'utf8') + String(process.pid) + String(new Worker('x')) + String(spawnSync('true').status) + String(new ResolverFactory({})) + readSibling;\n}\n"
      )
    );
    expect(errors).toEqual([]);
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
});
