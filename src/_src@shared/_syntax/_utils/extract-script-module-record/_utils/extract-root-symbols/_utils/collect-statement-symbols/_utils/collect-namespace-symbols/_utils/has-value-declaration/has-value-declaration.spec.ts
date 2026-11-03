import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { hasValueDeclaration } from './index.js';

const parseNamespaceBody = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'TSModuleDeclaration',
    'Expected TSModuleDeclaration'
  );
  return statement.body;
};

describe('hasValueDeclaration', () => {
  it('returns false for null namespace body', () => {
    expect(hasValueDeclaration(null)).toBe(false);
  });

  it('returns false when namespace contains only types and interfaces', () => {
    const body = parseNamespaceBody(
      'namespace Types { type T = string; interface I { x: number; } }'
    );
    expect(hasValueDeclaration(body)).toBe(false);
  });

  it.each([
    { code: 'namespace N { class C {} }', title: 'class' },
    { code: 'namespace N { function fn() {} }', title: 'function' },
    { code: 'namespace N { enum E { A } }', title: 'enum' },
    { code: 'namespace N { const val = 1; }', title: 'variable' },
    { code: 'namespace N { export const val = 1; }', title: 'exported value' },
    {
      code: 'namespace Outer { namespace Inner { const val = 1; } }',
      title: 'nested value namespace',
    },
  ])(
    'returns true when namespace contains a $title declaration',
    ({ code }) => {
      const body = parseNamespaceBody(code);
      expect(hasValueDeclaration(body)).toBe(true);
    }
  );

  it('returns false when nested namespace contains only types', () => {
    const body = parseNamespaceBody(
      'namespace Outer { namespace Inner { type T = number; } }'
    );
    expect(hasValueDeclaration(body)).toBe(false);
  });
});
