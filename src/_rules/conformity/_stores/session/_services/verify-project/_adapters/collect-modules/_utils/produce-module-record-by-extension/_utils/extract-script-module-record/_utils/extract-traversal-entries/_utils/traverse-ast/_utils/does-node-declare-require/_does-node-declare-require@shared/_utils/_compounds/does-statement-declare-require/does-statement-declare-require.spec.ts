import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { doesStatementDeclareRequire } from './does-statement-declare-require.util.js';

const parseFirstStatement = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement !== undefined, 'Expected statement');
  return statement;
};

describe('doesStatementDeclareRequire', () => {
  it.each([
    { code: 'const require = 1;', expected: true, title: 'variable' },
    {
      code: 'export const require = 1;',
      expected: true,
      title: 'exported variable',
    },
    { code: 'function require() {}', expected: true, title: 'function' },
    { code: 'class require {}', expected: true, title: 'class' },
    { code: 'enum require { A }', expected: true, title: 'enum' },
    { code: 'namespace require {}', expected: true, title: 'namespace' },
    { code: "import require from 'pkg';", expected: true, title: 'import' },
    {
      code: "import require = require('pkg');",
      expected: true,
      title: 'import equals',
    },
    { code: 'const other = 1;', expected: false, title: 'other variable' },
    { code: 'console.log(1);', expected: false, title: 'expression' },
  ])('evaluates $title declaration as $expected', ({ code, expected }) => {
    const statement = parseFirstStatement(code);
    expect(doesStatementDeclareRequire(statement)).toBe(expected);
  });

  it.each([
    {
      code: 'const module = 1;',
      expected: true,
      name: 'module',
      title: 'variable with custom name',
    },
    {
      code: 'export const exports = 1;',
      expected: true,
      name: 'exports',
      title: 'exported variable with custom name',
    },
    {
      code: "import module from 'pkg';",
      expected: true,
      name: 'module',
      title: 'import with custom name',
    },
    {
      code: "import exports = require('pkg');",
      expected: true,
      name: 'exports',
      title: 'import equals with custom name',
    },
  ])(
    'evaluates $title declaration as $expected',
    ({ code, expected, name }) => {
      const statement = parseFirstStatement(code);
      expect(doesStatementDeclareRequire(statement, name)).toBe(expected);
    }
  );
});
