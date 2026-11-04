import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { doesFunctionDeclareRequire } from './index.js';

const parseFunctionNode = (code: string): TAstNode => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement !== undefined, 'Expected statement');
  const node =
    statement.type === 'ExpressionStatement' ? statement.expression : statement;
  return { ...node, type: node.type };
};

describe('doesFunctionDeclareRequire', () => {
  it.each([
    {
      code: 'function require() {}',
      expected: true,
      title: 'function name require',
    },
    {
      code: 'function test(require: unknown) {}',
      expected: true,
      title: 'parameter require',
    },
    {
      code: 'function test() { const require = 1; }',
      expected: true,
      title: 'body variable require',
    },
    {
      code: 'function test(a: number) { const b = 2; }',
      expected: false,
      title: 'no require declarations',
    },
  ])('evaluates $title as $expected', ({ code, expected }) => {
    const node = parseFunctionNode(code);
    expect(doesFunctionDeclareRequire(node)).toBe(expected);
  });
});
