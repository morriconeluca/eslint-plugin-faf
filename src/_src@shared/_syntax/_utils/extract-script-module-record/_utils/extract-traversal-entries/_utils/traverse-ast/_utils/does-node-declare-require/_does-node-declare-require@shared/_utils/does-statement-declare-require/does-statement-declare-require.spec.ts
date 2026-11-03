import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { doesStatementDeclareRequire } from './index.js';

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
});
