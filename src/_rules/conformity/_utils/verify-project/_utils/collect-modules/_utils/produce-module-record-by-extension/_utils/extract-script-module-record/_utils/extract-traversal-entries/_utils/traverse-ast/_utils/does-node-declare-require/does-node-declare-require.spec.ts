import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TAstNode } from '../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
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
  it('returns true when program body declares require', () => {
    const result = parseSync('test.ts', 'const require = 1;', {
      lang: 'ts',
      sourceType: 'module',
    });
    const node: TAstNode = { ...result.program, type: result.program.type };
    expect(doesNodeDeclareRequire(node)).toBe(true);
  });

  it('returns false when program body does not declare require', () => {
    const result = parseSync('test.ts', 'const x = 1;', {
      lang: 'ts',
      sourceType: 'module',
    });
    const node: TAstNode = { ...result.program, type: result.program.type };
    expect(doesNodeDeclareRequire(node)).toBe(false);
  });

  it('returns true when block statement declares require', () => {
    const result = parseSync('test.ts', '{ const require = 1; }', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'BlockStatement', 'Expected block');
    const node: TAstNode = { ...statement, type: statement.type };
    expect(doesNodeDeclareRequire(node)).toBe(true);
  });

  it('returns true when catch clause binds require', () => {
    const result = parseSync('test.ts', 'try {} catch (require) {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'TryStatement', 'Expected try');
    const handler = statement.handler;
    assertInvariant(handler !== null, 'Expected catch handler');
    const node: TAstNode = { ...handler, type: handler.type };
    expect(doesNodeDeclareRequire(node)).toBe(true);
  });

  it('returns false when catch clause binds other name', () => {
    const result = parseSync('test.ts', 'try {} catch (err) {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'TryStatement', 'Expected try');
    const handler = statement.handler;
    assertInvariant(handler !== null, 'Expected catch handler');
    const node: TAstNode = { ...handler, type: handler.type };
    expect(doesNodeDeclareRequire(node)).toBe(false);
  });

  it('returns false for other node types', () => {
    const node: TAstNode = { type: 'NumericLiteral', value: 42 };
    expect(doesNodeDeclareRequire(node)).toBe(false);
  });

  it('returns true when program body declares custom name', () => {
    const result = parseSync('test.ts', 'const module = 1;', {
      lang: 'ts',
      sourceType: 'module',
    });
    const node: TAstNode = { ...result.program, type: result.program.type };
    expect(doesNodeDeclareRequire(node, 'module')).toBe(true);
  });

  it('returns true when catch clause binds custom name', () => {
    const result = parseSync('test.ts', 'try {} catch (module) {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'TryStatement', 'Expected try');
    const handler = statement.handler;
    assertInvariant(handler !== null, 'Expected catch handler');
    const node: TAstNode = { ...handler, type: handler.type };
    expect(doesNodeDeclareRequire(node, 'module')).toBe(true);
  });

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
  ])('evaluates function $title as $expected', ({ code, expected }) => {
    const node = parseFunctionNode(code);
    expect(doesNodeDeclareRequire(node)).toBe(expected);
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
  ])('evaluates function $title as $expected', ({ code, expected, name }) => {
    const node = parseFunctionNode(code);
    expect(doesNodeDeclareRequire(node, name)).toBe(expected);
  });
});
