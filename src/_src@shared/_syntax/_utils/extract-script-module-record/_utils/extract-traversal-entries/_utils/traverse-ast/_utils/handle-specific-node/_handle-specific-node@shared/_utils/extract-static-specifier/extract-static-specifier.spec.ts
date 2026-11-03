import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { extractStaticSpecifier } from './index.js';

describe('extractStaticSpecifier', () => {
  it('extracts string from Literal node', () => {
    const result = parseSync('test.ts', "const x = 'literal-value';", {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'VariableDeclaration', 'Expected var');
    const init = statement.declarations[0]?.init;
    assertInvariant(
      init !== null && init !== undefined,
      'Expected initializer'
    );

    expect(extractStaticSpecifier(init)).toBe('literal-value');
  });

  it('extracts string from TemplateLiteral without expressions', () => {
    const result = parseSync('test.ts', 'const x = `template-value`;', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'VariableDeclaration', 'Expected var');
    const init = statement.declarations[0]?.init;
    assertInvariant(
      init !== null && init !== undefined,
      'Expected initializer'
    );

    expect(extractStaticSpecifier(init)).toBe('template-value');
  });

  it('returns null for TemplateLiteral with expressions', () => {
    const result = parseSync('test.ts', 'const x = `template-${expr}`;', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'VariableDeclaration', 'Expected var');
    const init = statement.declarations[0]?.init;
    assertInvariant(
      init !== null && init !== undefined,
      'Expected initializer'
    );

    expect(extractStaticSpecifier(init)).toBeNull();
  });

  it('returns null for a numeric literal node a caller can produce', () => {
    const numericLiteral = { type: 'Literal', value: 42 };
    expect(extractStaticSpecifier(numericLiteral)).toBeNull();
  });

  it('returns null for a non-literal node that still carries a string value', () => {
    const identifier = { type: 'Identifier', value: 'not-a-specifier' };
    expect(extractStaticSpecifier(identifier)).toBeNull();
  });

  it('returns null for a literal node without a value property', () => {
    const literal = { type: 'Literal' };
    expect(extractStaticSpecifier(literal)).toBeNull();
  });
});
