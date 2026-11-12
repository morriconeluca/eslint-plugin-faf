import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { doesFunctionDeclareRequire } from './does-function-declare-require.util.js';

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

  it.each([
    {
      code: 'function module() {}',
      expected: true,
      name: 'module',
      title: 'function name with custom name',
    },
    {
      code: 'function test(exports: unknown) {}',
      expected: true,
      name: 'exports',
      title: 'parameter with custom name',
    },
    {
      code: 'function test() { const module = 1; }',
      expected: true,
      name: 'module',
      title: 'body variable with custom name',
    },
  ])('evaluates $title as $expected', ({ code, expected, name }) => {
    const node = parseFunctionNode(code);
    expect(doesFunctionDeclareRequire(node, name)).toBe(expected);
  });
});
