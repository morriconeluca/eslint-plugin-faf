import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TImportedBinding } from '../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { registerImportBindings } from './index.js';

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

describe('registerImportBindings', () => {
  it('registers default import specifier', () => {
    const statement = parseImportStatement("import myDefault from 'pkg';");
    const bindingMap = new Map<string, TImportedBinding>();

    registerImportBindings(statement, 'pkg', bindingMap);

    expect(bindingMap.get('myDefault')).toEqual({
      importedName: 'default',
      isNamespace: false,
      isTypeOnly: false,
      localName: 'myDefault',
      specifier: 'pkg',
    });
  });

  it('registers namespace import specifier', () => {
    const statement = parseImportStatement("import * as myNs from 'pkg';");
    const bindingMap = new Map<string, TImportedBinding>();

    registerImportBindings(statement, 'pkg', bindingMap);

    expect(bindingMap.get('myNs')).toEqual({
      importedName: '*',
      isNamespace: true,
      isTypeOnly: false,
      localName: 'myNs',
      specifier: 'pkg',
    });
  });

  it('registers named import specifiers with identifier and string literal', () => {
    const statement = parseImportStatement(
      "import { regular, 'string-literal' as aliasName } from 'pkg';"
    );
    const bindingMap = new Map<string, TImportedBinding>();

    registerImportBindings(statement, 'pkg', bindingMap);

    expect(bindingMap.get('regular')).toEqual({
      importedName: 'regular',
      isNamespace: false,
      isTypeOnly: false,
      localName: 'regular',
      specifier: 'pkg',
    });
    expect(bindingMap.get('aliasName')).toEqual({
      importedName: 'string-literal',
      isNamespace: false,
      isTypeOnly: false,
      localName: 'aliasName',
      specifier: 'pkg',
    });
  });

  it('marks bindings as type-only when declaration has type kind', () => {
    const statement = parseImportStatement(
      "import type { TypeSymbol } from 'pkg';"
    );
    const bindingMap = new Map<string, TImportedBinding>();

    registerImportBindings(statement, 'pkg', bindingMap);

    expect(bindingMap.get('TypeSymbol')?.isTypeOnly).toBe(true);
  });

  it('marks inline type specifiers as type-only', () => {
    const statement = parseImportStatement(
      "import { type TypeSymbol, valueSymbol } from 'pkg';"
    );
    const bindingMap = new Map<string, TImportedBinding>();

    registerImportBindings(statement, 'pkg', bindingMap);

    expect(bindingMap.get('TypeSymbol')?.isTypeOnly).toBe(true);
    expect(bindingMap.get('valueSymbol')?.isTypeOnly).toBe(false);
  });
});
