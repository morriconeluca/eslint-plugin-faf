import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../../../../../../../_conformity@shared/_types/verification-model.type.js';

import { parseModuleRecordCache } from './parse-module-record-cache.util.js';

const sampleRecord: TModuleRecord = {
  exports: [],
  imports: [],
  language: 'script',
  symbols: [],
  unsupportedSyntaxes: [],
};

const payload = (
  entries: readonly unknown[],
  packageVersion = '0.5.0',
  schemaVersion: unknown = 1
): Record<string, unknown> => ({
  entries,
  packageVersion,
  schemaVersion,
});

describe('parseModuleRecordCache', () => {
  it('returns entries when the payload and records are valid', () => {
    const parsed = parseModuleRecordCache({
      packageVersion: '0.5.0',
      raw: payload([['key1', sampleRecord]]),
      schemaVersion: 1,
    });
    expect(parsed?.get('key1')).toEqual(sampleRecord);
  });

  it('returns an empty map for an empty entry list', () => {
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([]),
        schemaVersion: 1,
      })?.size
    ).toBe(0);
  });

  it('rejects non-objects, wrong versions, and non-array entries', () => {
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: null,
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: 123,
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: ['key1', sampleRecord],
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord]], '0.5.0', 99),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord]], '0.4.0'),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: {
          packageVersion: '0.5.0',
          schemaVersion: 1,
        },
        schemaVersion: 1,
      })
    ).toBeUndefined();
  });

  it('rejects a file when any entry is malformed', () => {
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload(['not-a-tuple']),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['only-key']]),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['key1', sampleRecord, 'extra']]),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([[123, sampleRecord]]),
        schemaVersion: 1,
      })
    ).toBeUndefined();
    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([
          ['key1', sampleRecord],
          ['key2', { language: 'unknown' }],
        ]),
        schemaVersion: 1,
      })
    ).toBeUndefined();
  });

  it('validates all export origins, import kinds, symbols, and unsupported syntaxes while rejecting malformed records', () => {
    const richRecord: TModuleRecord = {
      exports: [
        {
          exportedName: 'testLocal',
          isTypeOnly: false,
          origin: { symbolName: 'testLocal', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
        {
          exportedName: '*',
          isTypeOnly: false,
          origin: { specifier: './dep.js', type: 'export-all' },
          position: { column: 1, line: 2 },
        },
        {
          exportedName: 'ns',
          isTypeOnly: false,
          origin: { specifier: './dep.js', type: 'namespace' },
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
      language: 'style',
      symbols: [
        { name: 'testLocal', position: { column: 1, line: 1 }, space: 'value' },
        { name: 'TType', position: { column: 1, line: 7 }, space: 'type' },
      ],
      unsupportedSyntaxes: [
        { description: 'dynamic require', position: { column: 1, line: 8 } },
      ],
    };

    expect(
      parseModuleRecordCache({
        packageVersion: '0.5.0',
        raw: payload([['rich', richRecord]]),
        schemaVersion: 1,
      })?.get('rich')
    ).toEqual(richRecord);

    const malformedCases: readonly unknown[] = [
      null,
      { ...richRecord, exports: 'bad' },
      { ...richRecord, exports: [null] },
      {
        ...richRecord,
        exports: [{ ...richRecord.exports[0], origin: null }],
      },
      {
        ...richRecord,
        exports: [{ ...richRecord.exports[0], origin: { type: 'bad' } }],
      },
      {
        ...richRecord,
        exports: [
          {
            ...richRecord.exports[0],
            origin: {
              importedName: 1,
              specifier: 'x',
              type: 'imported-binding',
            },
          },
        ],
      },
      { ...richRecord, imports: [null] },
      {
        ...richRecord,
        imports: [{ ...richRecord.imports[0], isTypeOnly: 'false' }],
      },
      { ...richRecord, imports: [{ ...richRecord.imports[0], kind: 'bad' }] },
      { ...richRecord, symbols: [null] },
      { ...richRecord, symbols: [{ ...richRecord.symbols[0], space: 'bad' }] },
      { ...richRecord, unsupportedSyntaxes: [null] },
      {
        ...richRecord,
        unsupportedSyntaxes: [
          { description: 1, position: { column: 1, line: 1 } },
        ],
      },
    ];
    for (const candidate of malformedCases) {
      expect(
        parseModuleRecordCache({
          packageVersion: '0.5.0',
          raw: payload([['bad', candidate]]),
          schemaVersion: 1,
        })
      ).toBeUndefined();
    }
  });

  it('accepts binary language and every valid import syntax kind', () => {
    const allKinds = [
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
      'typescript-reference-path',
      'typescript-require-import',
    ] as const;

    const record: TModuleRecord = {
      exports: [],
      imports: allKinds.map((kind, index) => ({
        isTypeOnly: false,
        kind,
        position: { column: 1, line: index + 1 },
        specifier: kind === 'non-literal-dynamic-import' ? null : './a.js',
      })),
      language: 'binary',
      symbols: [],
      unsupportedSyntaxes: [],
    };

    const parsed = parseModuleRecordCache({
      packageVersion: '0.5.0',
      raw: payload([['bin', record]]),
      schemaVersion: 1,
    });
    expect(parsed?.get('bin')).toEqual(record);
  });
});
