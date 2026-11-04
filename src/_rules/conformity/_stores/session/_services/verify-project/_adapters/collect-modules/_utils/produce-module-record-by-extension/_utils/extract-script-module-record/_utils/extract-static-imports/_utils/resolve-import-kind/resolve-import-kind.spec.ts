import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { resolveImportKind } from './index.js';

const parseImportStatement = (sourceText: string) => {
  const result = parseSync('test.ts', sourceText, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'ImportDeclaration',
    'Expected ImportDeclaration'
  );
  return statement;
};

describe('resolveImportKind', () => {
  it('resolves type-only-import for import type declaration', () => {
    const statement = parseImportStatement("import type { Foo } from 'pkg';");
    expect(resolveImportKind(statement)).toEqual({
      isTypeOnly: true,
      kind: 'type-only-import',
    });
  });

  it('resolves side-effect-import when specifiers are empty', () => {
    const statement = parseImportStatement("import 'pkg';");
    expect(resolveImportKind(statement)).toEqual({
      isTypeOnly: false,
      kind: 'side-effect-import',
    });
  });

  it('resolves mixed-type-specifier-import with isTypeOnly true when all specifiers are type', () => {
    const statement = parseImportStatement(
      "import { type A, type B } from 'pkg';"
    );
    expect(resolveImportKind(statement)).toEqual({
      isTypeOnly: true,
      kind: 'mixed-type-specifier-import',
    });
  });

  it('resolves mixed-type-specifier-import with isTypeOnly false when a value specifier is present', () => {
    const statement = parseImportStatement("import { type A, b } from 'pkg';");
    expect(resolveImportKind(statement)).toEqual({
      isTypeOnly: false,
      kind: 'mixed-type-specifier-import',
    });
  });

  it('resolves default-import for single default specifier', () => {
    const statement = parseImportStatement("import a from 'pkg';");
    expect(resolveImportKind(statement)).toEqual({
      isTypeOnly: false,
      kind: 'default-import',
    });
  });

  it('resolves namespace-import for single namespace specifier', () => {
    const statement = parseImportStatement("import * as a from 'pkg';");
    expect(resolveImportKind(statement)).toEqual({
      isTypeOnly: false,
      kind: 'namespace-import',
    });
  });

  it('resolves named-import for multiple value specifiers', () => {
    const statement = parseImportStatement("import { a, b } from 'pkg';");
    expect(resolveImportKind(statement)).toEqual({
      isTypeOnly: false,
      kind: 'named-import',
    });
  });

  it('resolves named-import for single named specifier', () => {
    const statement = parseImportStatement("import { a } from 'pkg';");
    expect(resolveImportKind(statement)).toEqual({
      isTypeOnly: false,
      kind: 'named-import',
    });
  });
});
