import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { doesPatternBindRequire } from './does-pattern-bind-require.util.js';

const parsePattern = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement?.type === 'VariableDeclaration', 'Expected var');
  const pattern = statement.declarations[0]?.id;
  assertInvariant(pattern !== undefined, 'Expected pattern');
  return pattern;
};

describe('doesPatternBindRequire', () => {
  it.each([
    { code: 'const require = 1;', expected: true, title: 'direct identifier' },
    {
      code: 'const { require = fn } = obj;',
      expected: true,
      title: 'assignment pattern default',
    },
    {
      code: 'const [first, , require] = items;',
      expected: true,
      title: 'array pattern element',
    },
    {
      code: 'const { prop: require } = obj;',
      expected: true,
      title: 'object pattern property',
    },
    {
      code: 'const [...require] = args;',
      expected: true,
      title: 'rest element',
    },
    {
      code: 'const other = 1;',
      expected: false,
      title: 'non-matching identifier',
    },
    {
      code: 'const [a, b, { c }] = items;',
      expected: false,
      title: 'nested pattern without require',
    },
  ])('evaluates $title pattern as $expected', ({ code, expected }) => {
    const pattern = parsePattern(code);
    expect(doesPatternBindRequire(pattern)).toBe(expected);
  });
});
