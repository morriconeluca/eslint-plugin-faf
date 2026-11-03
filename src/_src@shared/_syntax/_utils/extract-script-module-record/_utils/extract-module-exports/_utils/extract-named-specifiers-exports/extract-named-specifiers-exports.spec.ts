import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../_types/module-record.type.js';
import type { TImportedBinding } from '../../../../extract-script-module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { extractNamedSpecifiersExports } from './index.js';

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
});
