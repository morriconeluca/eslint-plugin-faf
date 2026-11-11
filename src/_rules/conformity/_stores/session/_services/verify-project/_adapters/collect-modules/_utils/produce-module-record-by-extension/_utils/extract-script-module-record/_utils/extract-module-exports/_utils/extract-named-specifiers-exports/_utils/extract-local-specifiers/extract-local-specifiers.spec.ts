import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportedBinding } from '../../../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';

import { assertInvariant } from '../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractLocalSpecifiers } from './extract-local-specifiers.util.js';

const createSymbol = (name: string, space: 'type' | 'value'): TRootSymbol => ({
  name,
  position: { column: 6, line: 1 },
  space,
});

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

  it('exports local type symbol when declaration is type-only and imported binding is value', () => {
    const code = 'export type { Bar };';
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
        'Bar',
        {
          importedName: 'Bar',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'Bar',
          specifier: './other.js',
        },
      ],
    ]);
    const symbols: TRootSymbol[] = [
      { name: 'Bar', position: { column: 6, line: 1 }, space: 'type' },
    ];

    extractLocalSpecifiers(statement, symbols, bindings, locator, exports);

    expect(exports).toEqual([
      {
        exportedName: 'Bar',
        isTypeOnly: true,
        origin: { symbolName: 'Bar', type: 'local-symbol' },
        position: { column: 15, line: 1 },
      },
    ]);
  });

  it('exports local type symbol when specifier is type-only and imported binding is value', () => {
    const code = 'export { type Bar };';
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
        'Bar',
        {
          importedName: 'Bar',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'Bar',
          specifier: './other.js',
        },
      ],
    ]);
    const symbols: TRootSymbol[] = [
      { name: 'Bar', position: { column: 6, line: 1 }, space: 'type' },
    ];

    extractLocalSpecifiers(statement, symbols, bindings, locator, exports);

    expect(exports).toEqual([
      {
        exportedName: 'Bar',
        isTypeOnly: true,
        origin: { symbolName: 'Bar', type: 'local-symbol' },
        position: { column: 10, line: 1 },
      },
    ]);
  });

  it('exports imported binding when export is not explicitly type-only even if local type exists', () => {
    const code = 'export { Bar };';
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
        'Bar',
        {
          importedName: 'Bar',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'Bar',
          specifier: './other.js',
        },
      ],
    ]);
    const symbols: TRootSymbol[] = [
      { name: 'Bar', position: { column: 6, line: 1 }, space: 'type' },
    ];

    extractLocalSpecifiers(statement, symbols, bindings, locator, exports);

    expect(exports).toEqual([
      {
        exportedName: 'Bar',
        isTypeOnly: false,
        origin: {
          importedName: 'Bar',
          specifier: './other.js',
          type: 'imported-binding',
        },
        position: { column: 10, line: 1 },
      },
    ]);
  });

  it.each([
    {
      bindings: new Map<string, TImportedBinding>([
        [
          'Bar',
          {
            importedName: 'Bar',
            isNamespace: false,
            isTypeOnly: true,
            localName: 'Bar',
            specifier: './other.js',
          },
        ],
      ]),
      symbols: [createSymbol('Bar', 'type')],
      title: 'imported binding is already type-only',
    },
    {
      bindings: new Map<string, TImportedBinding>([
        [
          'Bar',
          {
            importedName: 'Bar',
            isNamespace: false,
            isTypeOnly: false,
            localName: 'Bar',
            specifier: './other.js',
          },
        ],
      ]),
      symbols: [createSymbol('Bar', 'value')],
      title: 'local symbol is in value space',
    },
    {
      bindings: new Map<string, TImportedBinding>([
        [
          'Bar',
          {
            importedName: 'Bar',
            isNamespace: false,
            isTypeOnly: false,
            localName: 'Bar',
            specifier: './other.js',
          },
        ],
      ]),
      symbols: [createSymbol('Other', 'type')],
      title: 'local type symbol has different name',
    },
  ])(
    'exports imported binding when declaration is type-only and $title',
    ({ bindings, symbols }) => {
      const code = 'export type { Bar };';
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

      extractLocalSpecifiers(statement, symbols, bindings, locator, exports);

      expect(exports).toEqual([
        {
          exportedName: 'Bar',
          isTypeOnly: true,
          origin: {
            importedName: 'Bar',
            specifier: './other.js',
            type: 'imported-binding',
          },
          position: { column: 15, line: 1 },
        },
      ]);
    }
  );

  it('exports imported binding when type-only import merges with local value symbol and export is value', () => {
    const code = 'export { Foo };';
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
        'Foo',
        {
          importedName: 'Foo',
          isNamespace: false,
          isTypeOnly: true,
          localName: 'Foo',
          specifier: './dep.js',
        },
      ],
    ]);
    const symbols: TRootSymbol[] = [
      { name: 'Foo', position: { column: 6, line: 1 }, space: 'value' },
    ];

    extractLocalSpecifiers(statement, symbols, bindings, locator, exports);

    expect(exports).toEqual([
      {
        exportedName: 'Foo',
        isTypeOnly: true,
        origin: {
          importedName: 'Foo',
          specifier: './dep.js',
          type: 'imported-binding',
        },
        position: { column: 10, line: 1 },
      },
    ]);
  });
});
