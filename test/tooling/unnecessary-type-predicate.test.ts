import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import eslintConfig from '../../eslint.config.js';

describe('unnecessary type predicate conditions', () => {
  it('flags assertInvariant conditions already decided by the parameter type', async () => {
    const fixtureDirectory = path.resolve(
      import.meta.dirname,
      `../../.cache/test-fixtures/unnecessary-predicate-${String(process.pid)}`
    );
    fs.rmSync(fixtureDirectory, { force: true, recursive: true });
    fs.mkdirSync(fixtureDirectory, { recursive: true });
    const fixturePath = path.join(fixtureDirectory, 'predicate-case.ts');
    fs.writeFileSync(
      fixturePath,
      [
        "import { assertInvariant } from '../../src/_rules/conformity/_stores/session/_services/verify-project/_verify-project@shared/_utils/assert-invariant/index.js';",
        '',
        'export const check = (value: string): void => {',
        "  assertInvariant(typeof value === 'string', 'Expected string');",
        '};',
        '',
      ].join('\n')
    );

    try {
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
      const results = await eslint.lintFiles([fixturePath]);
      const ruleIds = (results[0]?.messages ?? []).map(
        (message) => message.ruleId
      );
      expect(ruleIds).toContain('repository/no-decided-assertion');
    } finally {
      fs.rmSync(fixtureDirectory, { force: true, recursive: true });
    }
  }, 60_000);
});
