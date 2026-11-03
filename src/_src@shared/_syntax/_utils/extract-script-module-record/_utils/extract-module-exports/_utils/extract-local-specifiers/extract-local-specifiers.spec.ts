import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../_types/module-record.type.js';
import type { TImportedBinding } from '../../../../extract-script-module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { extractLocalSpecifiers } from './index.js';

describe('extractLocalSpecifiers', () => {
  it('extracts local symbol export', () => {
    const code = 'export { val };';
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
    const symbols: TRootSymbol[] = [
      { name: 'val', position: { column: 7, line: 1 }, space: 'value' },
    ];

    extractLocalSpecifiers(statement, symbols, new Map(), locator, exports);

    expect(exports).toEqual([
      {
        exportedName: 'val',
        isTypeOnly: false,
        origin: { symbolName: 'val', type: 'local-symbol' },
        position: { column: 10, line: 1 },
      },
    ]);
  });

  it('marks local symbol export as type-only when symbol has type space', () => {
    const code = 'export { MyType };';
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
    const symbols: TRootSymbol[] = [
      { name: 'MyType', position: { column: 6, line: 1 }, space: 'type' },
    ];

    extractLocalSpecifiers(statement, symbols, new Map(), locator, exports);

    expect(exports[0]?.isTypeOnly).toBe(true);
  });

  it('marks local value symbol export as type-only when declaration has type kind', () => {
    const code = 'export type { val };';
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
    const symbols: TRootSymbol[] = [
      { name: 'val', position: { column: 7, line: 1 }, space: 'value' },
    ];

    extractLocalSpecifiers(statement, symbols, new Map(), locator, exports);

    expect(exports[0]?.isTypeOnly).toBe(true);
  });

  it('marks local value symbol export as type-only when specifier has type kind', () => {
    const code = 'export { type val };';
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
    const symbols: TRootSymbol[] = [
      { name: 'val', position: { column: 7, line: 1 }, space: 'value' },
    ];

    extractLocalSpecifiers(statement, symbols, new Map(), locator, exports);

    expect(exports[0]?.isTypeOnly).toBe(true);
  });

  it('extracts re-export of imported binding', () => {
    const code = 'export { imported };';
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
    const bindings = new Map<string, TImportedBinding>([
      [
        'imported',
        {
          importedName: 'orig',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'imported',
          specifier: './dep.js',
        },
      ],
    ]);

    extractLocalSpecifiers(statement, [], bindings, locator, exports);

    expect(exports).toEqual([
      {
        exportedName: 'imported',
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

  it('marks imported binding export as type-only when declaration has type kind', () => {
    const code = 'export type { imported };';
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
    const bindings = new Map<string, TImportedBinding>([
      [
        'imported',
        {
          importedName: 'orig',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'imported',
          specifier: './dep.js',
        },
      ],
    ]);

    extractLocalSpecifiers(statement, [], bindings, locator, exports);

    expect(exports[0]?.isTypeOnly).toBe(true);
  });

  it('marks imported binding export as type-only when specifier has type kind', () => {
    const code = 'export { type imported };';
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
    const bindings = new Map<string, TImportedBinding>([
      [
        'imported',
        {
          importedName: 'orig',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'imported',
          specifier: './dep.js',
        },
      ],
    ]);

    extractLocalSpecifiers(statement, [], bindings, locator, exports);

    expect(exports[0]?.isTypeOnly).toBe(true);
  });

  it('extracts re-export of imported namespace', () => {
    const code = 'export { ns };';
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

    extractLocalSpecifiers(statement, [], bindings, locator, exports);

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
});
