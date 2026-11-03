import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { doesTargetDeclareRequire } from './index.js';

const parseStatement = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement !== undefined, 'Expected statement');
  return statement;
};

describe('doesTargetDeclareRequire', () => {
  it.each([
    {
      code: 'namespace require {}',
      expected: true,
      title: 'namespace require',
    },
    { code: 'class require {}', expected: true, title: 'class require' },
    {
      code: 'function require() {}',
      expected: true,
      title: 'function require',
    },
    { code: 'enum require { A }', expected: true, title: 'enum require' },
    { code: 'class other {}', expected: false, title: 'other class' },
    { code: 'const x = 1;', expected: false, title: 'variable' },
  ])('evaluates $title as $expected', ({ code, expected }) => {
    const statement = parseStatement(code);
    expect(doesTargetDeclareRequire(statement)).toBe(expected);
  });
});
