import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { doesNodeDeclareRequire } from './does-node-declare-require.util.js';

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

describe('doesNodeDeclareRequire', () => {
  it('detects require and custom identifiers across program, block, export, import, catch, and destructuring patterns', () => {
    const cases: readonly {
      readonly code: string;
      readonly expected: boolean;
      readonly name?: string;
    }[] = [
      { code: 'const require = 1;', expected: true },
      { code: 'const x = 1;', expected: false },
      { code: 'export const require = 1;', expected: true },
      { code: 'export { x };', expected: false },
      { code: 'const [a = 1, ...require] = arr;', expected: true },
      { code: 'const { prop: require = 1 } = obj;', expected: true },
      { code: 'const { ...require } = obj;', expected: true },
      { code: 'import require from "./mod";', expected: true },
      { code: 'import require = require("./mod");', expected: true },
      { code: 'class require {}', expected: true },
      { code: 'enum require { A }', expected: true },
      { code: 'namespace require {}', expected: true },
      { code: 'const module = 1;', expected: true, name: 'module' },
    ];

    for (const testCase of cases) {
      const result = parseSync('test.ts', testCase.code, {
        lang: 'ts',
        sourceType: 'module',
      });
      const node: TAstNode = { ...result.program, type: result.program.type };
      expect(doesNodeDeclareRequire(node, testCase.name)).toBe(
        testCase.expected
      );
    }

    const blockResult = parseSync('test.ts', '{ const require = 1; }', {
      lang: 'ts',
      sourceType: 'module',
    });
    const blockStatement = blockResult.program.body[0];
    assertInvariant(
      blockStatement?.type === 'BlockStatement',
      'Expected block'
    );
    expect(
      doesNodeDeclareRequire({ ...blockStatement, type: blockStatement.type })
    ).toBe(true);

    const catchResult = parseSync('test.ts', 'try {} catch (require) {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const tryStatement = catchResult.program.body[0];
    assertInvariant(tryStatement?.type === 'TryStatement', 'Expected try');
    assertInvariant(tryStatement.handler !== null, 'Expected catch handler');
    expect(
      doesNodeDeclareRequire({
        ...tryStatement.handler,
        type: tryStatement.handler.type,
      })
    ).toBe(true);

    expect(doesNodeDeclareRequire({ type: 'NumericLiteral', value: 42 })).toBe(
      false
    );
  });

  it.each([
    { code: 'function require() {}', expected: true },
    { code: 'function test(require: unknown) {}', expected: true },
    { code: 'function test() { const require = 1; }', expected: true },
    { code: 'function test(a: number) { const b = 2; }', expected: false },
    {
      code: 'function module() {}',
      expected: true,
      name: 'module',
    },
    {
      code: 'function test(exports: unknown) {}',
      expected: true,
      name: 'exports',
    },
  ])('evaluates function $code as $expected', ({ code, expected, name }) => {
    expect(doesNodeDeclareRequire(parseFunctionNode(code), name)).toBe(
      expected
    );
  });
});
