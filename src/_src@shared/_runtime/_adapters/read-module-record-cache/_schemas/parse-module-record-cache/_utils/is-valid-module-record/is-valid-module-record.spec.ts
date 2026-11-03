import { describe, expect, it } from 'vitest';

import type {
  TImportSyntaxKind,
  TModuleRecord,
} from '../../../../../../../_syntax/_types/module-record.type.js';

import { isValidModuleRecord } from './is-valid-module-record.util.js';

describe('isValidModuleRecord', () => {
  const validRecord: TModuleRecord = {
    exports: [
      {
        exportedName: 'testLocal',
        isTypeOnly: false,
        origin: {
          symbolName: 'testLocal',
          type: 'local-symbol',
        },
        position: { column: 1, line: 1 },
      },
      {
        exportedName: '*',
        isTypeOnly: false,
        origin: {
          specifier: './dep.js',
          type: 'export-all',
        },
        position: { column: 1, line: 2 },
      },
      {
        exportedName: 'ns',
        isTypeOnly: false,
        origin: {
          specifier: './dep.js',
          type: 'namespace',
        },
        position: { column: 1, line: 3 },
      },
      {
        exportedName: 'named',
        isTypeOnly: true,
        origin: {
          importedName: 'origNamed',
          specifier: './dep.js',
          type: 'imported-binding',
        },
        position: { column: 1, line: 4 },
      },
    ],
    imports: [
      {
        isTypeOnly: false,
        kind: 'named-import',
        position: { column: 1, line: 5 },
        specifier: './dep.js',
      },
      {
        isTypeOnly: false,
        kind: 'non-literal-dynamic-import',
        position: { column: 1, line: 6 },
        specifier: null,
      },
    ],
    language: 'script',
    symbols: [
      {
        name: 'testLocal',
        position: { column: 1, line: 1 },
        space: 'value',
      },
      {
        name: 'TType',
        position: { column: 1, line: 7 },
        space: 'type',
      },
    ],
    unsupportedSyntaxes: [
      {
        description: 'complex dynamic require',
        position: { column: 1, line: 8 },
      },
    ],
  };

  it('validates a conformant module record', () => {
    const candidate: unknown = validRecord;
    expect(isValidModuleRecord(candidate)).toBe(true);
  });

  it('accepts every supported import kind', () => {
    const kinds: readonly TImportSyntaxKind[] = [
      'css-at-import',
      'css-url',
      'default-import',
      'export-all-from',
      'export-named-from',
      'export-type-from',
      'literal-dynamic-import',
      'mixed-type-specifier-import',
      'named-import',
      'namespace-import',
      'non-literal-dynamic-import',
      'require-call',
      'side-effect-import',
      'type-only-import',
      'typescript-import-type',
      'typescript-require-import',
    ];
    for (const kind of kinds) {
      expect(
        isValidModuleRecord({
          ...validRecord,
          imports: [{ ...validRecord.imports[0], kind }],
        })
      ).toBe(true);
    }
  });

  it('rejects a collection that mixes a valid entry with an invalid one', () => {
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [validRecord.exports[0], null],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        symbols: [validRecord.symbols[0], null],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        imports: [validRecord.imports[0], null],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        unsupportedSyntaxes: [validRecord.unsupportedSyntaxes[0], null],
      })
    ).toBe(false);
  });

  it('validates binary and style languages', () => {
    expect(isValidModuleRecord({ ...validRecord, language: 'binary' })).toBe(
      true
    );
    expect(isValidModuleRecord({ ...validRecord, language: 'style' })).toBe(
      true
    );
  });

  it('rejects null, non-objects, and arrays', () => {
    expect(isValidModuleRecord(null)).toBe(false);
    expect(isValidModuleRecord(undefined)).toBe(false);
    expect(isValidModuleRecord('not-record')).toBe(false);
    expect(isValidModuleRecord(123)).toBe(false);
    expect(isValidModuleRecord([])).toBe(false);
  });

  it('rejects unsupported languages', () => {
    expect(isValidModuleRecord({ ...validRecord, language: 'unknown' })).toBe(
      false
    );
    expect(isValidModuleRecord({ ...validRecord, language: 123 })).toBe(false);
  });

  it('rejects non-array collections', () => {
    expect(isValidModuleRecord({ ...validRecord, exports: 'not-array' })).toBe(
      false
    );
    expect(isValidModuleRecord({ ...validRecord, imports: null })).toBe(false);
    expect(isValidModuleRecord({ ...validRecord, symbols: {} })).toBe(false);
    expect(
      isValidModuleRecord({ ...validRecord, unsupportedSyntaxes: false })
    ).toBe(false);
  });

  it('rejects malformed exports', () => {
    expect(isValidModuleRecord({ ...validRecord, exports: [null] })).toBe(
      false
    );
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [{ ...validRecord.exports[0], exportedName: 123 }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [{ ...validRecord.exports[0], isTypeOnly: 'true' }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [{ ...validRecord.exports[0], position: null }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [
          {
            ...validRecord.exports[0],
            position: { column: '1', line: 1 },
          },
        ],
      })
    ).toBe(false);
  });

  it('rejects invalid export origins', () => {
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [{ ...validRecord.exports[0], origin: null }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [{ ...validRecord.exports[0], origin: { type: 'unknown' } }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [
          {
            ...validRecord.exports[0],
            origin: { symbolName: 123, type: 'local-symbol' },
          },
        ],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [
          {
            ...validRecord.exports[0],
            origin: { specifier: 123, type: 'export-all' },
          },
        ],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [
          {
            ...validRecord.exports[0],
            origin: { specifier: 123, type: 'namespace' },
          },
        ],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [
          {
            ...validRecord.exports[0],
            origin: {
              importedName: 123,
              specifier: './dep.js',
              type: 'imported-binding',
            },
          },
        ],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        exports: [
          {
            ...validRecord.exports[0],
            origin: {
              importedName: 'named',
              specifier: 123,
              type: 'imported-binding',
            },
          },
        ],
      })
    ).toBe(false);
  });

  it('rejects malformed imports', () => {
    expect(isValidModuleRecord({ ...validRecord, imports: [null] })).toBe(
      false
    );
    expect(
      isValidModuleRecord({
        ...validRecord,
        imports: [{ ...validRecord.imports[0], isTypeOnly: 'false' }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        imports: [{ ...validRecord.imports[0], kind: 'unknown-kind' }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        imports: [{ ...validRecord.imports[0], specifier: 123 }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        imports: [
          {
            ...validRecord.imports[0],
            position: { column: 1, line: 'bad' },
          },
        ],
      })
    ).toBe(false);
  });

  it('rejects malformed symbols', () => {
    expect(isValidModuleRecord({ ...validRecord, symbols: [null] })).toBe(
      false
    );
    expect(
      isValidModuleRecord({
        ...validRecord,
        symbols: [{ ...validRecord.symbols[0], name: 123 }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        symbols: [{ ...validRecord.symbols[0], space: 'unknown' }],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        symbols: [{ ...validRecord.symbols[0], position: null }],
      })
    ).toBe(false);
  });

  it('rejects malformed unsupported syntax entries', () => {
    expect(
      isValidModuleRecord({ ...validRecord, unsupportedSyntaxes: [null] })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        unsupportedSyntaxes: [
          { ...validRecord.unsupportedSyntaxes[0], description: 123 },
        ],
      })
    ).toBe(false);
    expect(
      isValidModuleRecord({
        ...validRecord,
        unsupportedSyntaxes: [
          { ...validRecord.unsupportedSyntaxes[0], position: null },
        ],
      })
    ).toBe(false);
  });
});
