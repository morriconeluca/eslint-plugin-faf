import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TImportedBinding } from '../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';

import { assertInvariant } from '../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractNamedSpecifiersExports } from './extract-named-specifiers-exports.util.js';

const parseAndExtractSpecifiers = (
  code: string,
  rootSymbols: readonly TRootSymbol[] = [],
  importedBindings: ReadonlyMap<string, TImportedBinding> = new Map()
): TModuleExport[] => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'ExportNamedDeclaration',
    'Expected export'
  );
  const locator = createSourceLocator(code);
  const exports: TModuleExport[] = [];
  extractNamedSpecifiersExports(
    statement,
    rootSymbols,
    importedBindings,
    locator,
    exports
  );
  return exports;
};

describe('extractNamedSpecifiersExports', () => {
  it('extracts re-export specifiers from external source', () => {
    const exports = parseAndExtractSpecifiers(
      "export { orig as renamed } from './dep.js';"
    );
    expect(exports).toEqual([
      {
        exportedName: 'renamed',
        isTypeOnly: false,
        origin: {
          importedName: 'orig',
          specifier: './dep.js',
          type: 'imported-binding',
        },
        position: { column: 10, line: 1 },
      },
    ]);
  });

  it('marks re-export specifiers as type-only when declaration has type kind', () => {
    const exports = parseAndExtractSpecifiers(
      "export type { orig } from './dep.js';"
    );
    expect(exports[0]?.isTypeOnly).toBe(true);
  });

  it('extracts local export of imported binding', () => {
    const bindings = new Map<string, TImportedBinding>([
      [
        'importedVal',
        {
          importedName: 'externalVal',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'importedVal',
          specifier: './dep.js',
        },
      ],
    ]);
    const exports = parseAndExtractSpecifiers(
      'export { importedVal };',
      [],
      bindings
    );
    expect(exports).toEqual([
      {
        exportedName: 'importedVal',
        isTypeOnly: false,
        origin: {
          importedName: 'externalVal',
          specifier: './dep.js',
          type: 'imported-binding',
        },
        position: { column: 10, line: 1 },
      },
    ]);
  });

  it('extracts local export of imported namespace', () => {
    const bindings = new Map<string, TImportedBinding>([
      [
        'ns',
        {
          importedName: '*',
          isNamespace: true,
          isTypeOnly: false,
          localName: 'ns',
          specifier: './dep.js',
        },
      ],
    ]);
    const exports = parseAndExtractSpecifiers('export { ns };', [], bindings);
    expect(exports).toEqual([
      {
        exportedName: 'ns',
        isTypeOnly: false,
        origin: {
          specifier: './dep.js',
          type: 'namespace',
        },
        position: { column: 10, line: 1 },
      },
    ]);
  });

  it('extracts local export of local symbol', () => {
    const symbols: TRootSymbol[] = [
      { name: 'localVal', position: { column: 7, line: 1 }, space: 'value' },
    ];
    const exports = parseAndExtractSpecifiers('export { localVal };', symbols);
    expect(exports).toEqual([
      {
        exportedName: 'localVal',
        isTypeOnly: false,
        origin: {
          symbolName: 'localVal',
          type: 'local-symbol',
        },
        position: { column: 10, line: 1 },
      },
    ]);
  });

  it('marks local export of type-space symbol as type-only', () => {
    const symbols: TRootSymbol[] = [
      { name: 'MyType', position: { column: 6, line: 1 }, space: 'type' },
    ];
    const exports = parseAndExtractSpecifiers('export { MyType };', symbols);
    expect(exports[0]?.isTypeOnly).toBe(true);
  });

  it('prefers local type-space symbol over value import for export type and extracts literal export names', () => {
    const bindings = new Map<string, TImportedBinding>([
      [
        'Merged',
        {
          importedName: 'Merged',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'Merged',
          specifier: './dep.js',
        },
      ],
    ]);
    const symbols: TRootSymbol[] = [
      { name: 'Merged', position: { column: 6, line: 1 }, space: 'type' },
    ];
    const localTypeExports = parseAndExtractSpecifiers(
      'export type { Merged };',
      symbols,
      bindings
    );
    expect(localTypeExports[0]?.origin).toEqual({
      symbolName: 'Merged',
      type: 'local-symbol',
    });

    const literalExports = parseAndExtractSpecifiers(
      "export { orig as 'custom-name' } from './dep.js';"
    );
    expect(literalExports[0]?.exportedName).toBe('custom-name');

    const inlineTypeReExport = parseAndExtractSpecifiers(
      "export { type orig } from './dep.js';"
    );
    expect(inlineTypeReExport[0]?.isTypeOnly).toBe(true);
  });

  it('handles merged value+type symbols, unknown symbols, and value-vs-type imported bindings cleanly', () => {
    const mergedSymbols: TRootSymbol[] = [
      { name: 'Other', position: { column: 1, line: 1 }, space: 'value' },
      { name: 'X', position: { column: 1, line: 2 }, space: 'value' },
      { name: 'X', position: { column: 1, line: 3 }, space: 'type' },
      { name: 'OnlyType', position: { column: 1, line: 4 }, space: 'type' },
    ];
    expect(
      parseAndExtractSpecifiers('export { X };', mergedSymbols)[0]?.isTypeOnly
    ).toBe(false);
    expect(
      parseAndExtractSpecifiers('export { unknownId };', mergedSymbols)[0]
        ?.isTypeOnly
    ).toBe(false);
    expect(
      parseAndExtractSpecifiers('export { OnlyType };', mergedSymbols)[0]
        ?.isTypeOnly
    ).toBe(true);
    expect(
      parseAndExtractSpecifiers('export { type Other };', mergedSymbols)[0]
        ?.isTypeOnly
    ).toBe(true);

    const bindings = new Map<string, TImportedBinding>([
      [
        'TypeImp',
        {
          importedName: 'TypeImp',
          isNamespace: false,
          isTypeOnly: true,
          localName: 'TypeImp',
          specifier: './dep.js',
        },
      ],
      [
        'Val',
        {
          importedName: 'Val',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'Val',
          specifier: './dep.js',
        },
      ],
    ]);
    const localMixedSymbols: TRootSymbol[] = [
      { name: 'Other', position: { column: 1, line: 1 }, space: 'value' },
      { name: 'TypeImp', position: { column: 1, line: 2 }, space: 'type' },
    ];
    const valueBindingTypeExport = parseAndExtractSpecifiers(
      'export type { Val };',
      localMixedSymbols,
      bindings
    );
    expect(valueBindingTypeExport[0]).toMatchObject({
      isTypeOnly: true,
      origin: {
        importedName: 'Val',
        specifier: './dep.js',
        type: 'imported-binding',
      },
    });

    const typeBindingValueExport = parseAndExtractSpecifiers(
      'export { TypeImp };',
      localMixedSymbols,
      bindings
    );
    expect(typeBindingValueExport[0]).toMatchObject({
      isTypeOnly: true,
      origin: {
        importedName: 'TypeImp',
        specifier: './dep.js',
        type: 'imported-binding',
      },
    });

    const mergedBindingValueExport = parseAndExtractSpecifiers(
      'export { Val };',
      [{ name: 'Val', position: { column: 1, line: 1 }, space: 'type' }],
      bindings
    );
    expect(mergedBindingValueExport[0]).toMatchObject({
      isTypeOnly: false,
      origin: {
        importedName: 'Val',
        specifier: './dep.js',
        type: 'imported-binding',
      },
    });

    const typeBindingExplicitTypeExport = parseAndExtractSpecifiers(
      'export type { TypeImp };',
      localMixedSymbols,
      bindings
    );
    expect(typeBindingExplicitTypeExport[0]).toMatchObject({
      isTypeOnly: true,
      origin: {
        importedName: 'TypeImp',
        specifier: './dep.js',
        type: 'imported-binding',
      },
    });
  });
});
