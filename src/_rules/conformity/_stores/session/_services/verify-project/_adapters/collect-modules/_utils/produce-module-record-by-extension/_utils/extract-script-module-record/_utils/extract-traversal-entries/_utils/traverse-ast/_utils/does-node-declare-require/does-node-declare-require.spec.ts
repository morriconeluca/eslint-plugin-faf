import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TAstNode } from '../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { doesNodeDeclareRequire } from './does-node-declare-require.util.js';

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

  it('returns true for function node that declares require', () => {
    const result = parseSync('test.ts', 'function require() {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'FunctionDeclaration',
      'Expected function'
    );
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

  it('returns true when function declares custom name parameter', () => {
    const result = parseSync('test.ts', 'function fn(exports) {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'FunctionDeclaration',
      'Expected function'
    );
    const node: TAstNode = { ...statement, type: statement.type };
    expect(doesNodeDeclareRequire(node, 'exports')).toBe(true);
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
});
