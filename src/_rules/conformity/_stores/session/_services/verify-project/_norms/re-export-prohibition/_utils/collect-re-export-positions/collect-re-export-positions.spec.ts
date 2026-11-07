import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TModuleImport,
  TModuleRecord,
} from '../../../../../../_session@shared/_types/module-record.type.js';

import { collectReExportPositions } from './collect-re-export-positions.util.js';

const makeRecord = (
  exports: readonly TModuleExport[] = [],
  imports: readonly TModuleImport[] = []
): TModuleRecord => ({
  exports,
  imports,
  language: 'script',
  symbols: [],
  unsupportedSyntaxes: [],
});

describe('collectReExportPositions', () => {
  it('returns empty array when there are no exports', () => {
    expect(collectReExportPositions(makeRecord())).toEqual([]);
  });

  it('returns empty array when all exports are local symbols', () => {
    const record = makeRecord([
      {
        exportedName: 'widget',
        isTypeOnly: false,
        origin: { symbolName: 'widget', type: 'local-symbol' },
        position: { column: 10, line: 1 },
      },
    ]);
    expect(collectReExportPositions(record)).toEqual([]);
  });

  it('returns position for direct re-export', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'value',
          isTypeOnly: false,
          origin: {
            importedName: 'value',
            specifier: './source.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 1 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'export-named-from',
          position: { column: 1, line: 1 },
          specifier: './source.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 1 }]);
  });

  it('returns position for direct type re-export (export-type-from)', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'Value',
          isTypeOnly: true,
          origin: {
            importedName: 'Value',
            specifier: './source.js',
            type: 'imported-binding',
          },
          position: { column: 15, line: 2 },
        },
      ],
      [
        {
          isTypeOnly: true,
          kind: 'export-type-from',
          position: { column: 1, line: 1 },
          specifier: './source.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 1 }]);
  });

  it('preserves direct statement line instead of export line for multiline re-export', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'value',
          isTypeOnly: false,
          origin: {
            importedName: 'value',
            specifier: './source.js',
            type: 'imported-binding',
          },
          position: { column: 3, line: 2 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'export-named-from',
          position: { column: 1, line: 1 },
          specifier: './source.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 1 }]);
  });

  it('does not emit direct position when direct export statement has no matching export', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'local',
          isTypeOnly: false,
          origin: {
            importedName: 'local',
            specifier: './other.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 3 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'export-named-from',
          position: { column: 1, line: 1 },
          specifier: './empty.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 3 }]);
  });

  it('produces a single outcome for direct re-export statement with multiple names', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'first',
          isTypeOnly: false,
          origin: {
            importedName: 'first',
            specifier: './source.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 1 },
        },
        {
          exportedName: 'second',
          isTypeOnly: false,
          origin: {
            importedName: 'second',
            specifier: './source.js',
            type: 'imported-binding',
          },
          position: { column: 18, line: 1 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'export-named-from',
          position: { column: 1, line: 1 },
          specifier: './source.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 1 }]);
  });

  it('returns position for export-all wildcard re-export', () => {
    const record = makeRecord(
      [
        {
          exportedName: '*',
          isTypeOnly: false,
          origin: { specifier: './source.js', type: 'export-all' },
          position: { column: 3, line: 2 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'export-all-from',
          position: { column: 1, line: 1 },
          specifier: './source.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 1 }]);
  });

  it('ignores direct re-export when statement exports no symbols', () => {
    const record = makeRecord(
      [],
      [
        {
          isTypeOnly: false,
          kind: 'export-named-from',
          position: { column: 1, line: 1 },
          specifier: './empty.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([]);
  });

  it('distinguishes multiple direct re-export statements', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'a',
          isTypeOnly: false,
          origin: {
            importedName: 'a',
            specifier: './sourceA.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 1 },
        },
        {
          exportedName: 'b',
          isTypeOnly: false,
          origin: {
            importedName: 'b',
            specifier: './sourceB.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 2 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'export-named-from',
          position: { column: 1, line: 1 },
          specifier: './sourceA.js',
        },
        {
          isTypeOnly: false,
          kind: 'export-named-from',
          position: { column: 1, line: 2 },
          specifier: './sourceB.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([
      { column: 1, line: 1 },
      { column: 1, line: 2 },
    ]);
  });

  it('returns position for local export of imported binding', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'value',
          isTypeOnly: false,
          origin: {
            importedName: 'value',
            specifier: './source.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 2 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'named-import',
          position: { column: 1, line: 1 },
          specifier: './source.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 2 }]);
  });

  it('produces a single outcome for local export statement with multiple imported bindings on same line', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'a',
          isTypeOnly: false,
          origin: {
            importedName: 'a',
            specifier: './source.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 2 },
        },
        {
          exportedName: 'b',
          isTypeOnly: false,
          origin: {
            importedName: 'b',
            specifier: './source.js',
            type: 'imported-binding',
          },
          position: { column: 14, line: 2 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'named-import',
          position: { column: 1, line: 1 },
          specifier: './source.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 2 }]);
  });

  it('returns position for local export of imported namespace', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'source',
          isTypeOnly: false,
          origin: {
            specifier: './source.js',
            type: 'namespace',
          },
          position: { column: 10, line: 2 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'namespace-import',
          position: { column: 1, line: 1 },
          specifier: './source.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([{ column: 1, line: 2 }]);
  });

  it('combines direct and local re-exports sorted and deduplicated', () => {
    const record = makeRecord(
      [
        {
          exportedName: 'direct',
          isTypeOnly: false,
          origin: {
            importedName: 'direct',
            specifier: './direct.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 1 },
        },
        {
          exportedName: 'local',
          isTypeOnly: false,
          origin: {
            importedName: 'local',
            specifier: './local.js',
            type: 'imported-binding',
          },
          position: { column: 10, line: 3 },
        },
      ],
      [
        {
          isTypeOnly: false,
          kind: 'export-named-from',
          position: { column: 1, line: 1 },
          specifier: './direct.js',
        },
        {
          isTypeOnly: false,
          kind: 'named-import',
          position: { column: 1, line: 2 },
          specifier: './local.js',
        },
      ]
    );

    expect(collectReExportPositions(record)).toEqual([
      { column: 1, line: 1 },
      { column: 1, line: 3 },
    ]);
  });
});
