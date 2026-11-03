import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
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

    expect(extractStaticSpecifier(init)).toBeNull();
  });

  it('returns null for non-record or non-string nodes', () => {
    expect(extractStaticSpecifier(null)).toBeNull();
    expect(extractStaticSpecifier(123)).toBeNull();
    expect(extractStaticSpecifier({ type: 'Literal', value: 42 })).toBeNull();
  });
});
