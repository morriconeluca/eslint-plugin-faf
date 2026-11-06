import { describe, expect, it } from 'vitest';

import type {
  TModuleExport,
  TModuleRecord,
  TRootSymbol,
} from '../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TEdgeMetadata } from '../../../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { isMasterReExported } from './is-master-re-exported.util.js';

const makeRecord = (
  symbols: readonly TRootSymbol[],
  exports: readonly TModuleExport[]
): TModuleRecord => ({
  exports,
  imports: [],
  language: 'script',
  symbols,
  unsupportedSyntaxes: [],
});

const makeEdge = (
  destinationPath: string,
  specifier: string
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath: 'src/_components/button/index.ts',
  specifier,
  syntaxKind: 'named-import',
});

describe('isMasterReExported', () => {
  const masterPath = 'src/_components/button/button.component.ts';

  it('returns true when Master has no identifiable exported symbol', () => {
    const zeroSymbols = makeRecord([], []);
    expect(isMasterReExported([], masterPath, zeroSymbols, [])).toBe(true);

    const twoSymbols = makeRecord(
      [
        { name: 's1', position: { column: 1, line: 1 }, space: 'value' },
        { name: 's2', position: { column: 1, line: 2 }, space: 'value' },
      ],
      []
    );
    expect(isMasterReExported([], masterPath, twoSymbols, [])).toBe(true);

    const zeroExports = makeRecord(
      [{ name: 's1', position: { column: 1, line: 1 }, space: 'value' }],
      []
    );
    expect(isMasterReExported([], masterPath, zeroExports, [])).toBe(true);

    const sparseSymbols = Array.from<TRootSymbol>({ length: 1 });
    const sparseRecord = makeRecord(sparseSymbols, []);
    expect(isMasterReExported([], masterPath, sparseRecord, [])).toBe(true);
  });

  it('handles export-all exposure correctly', () => {
    const masterNamed = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'Button',
          isTypeOnly: false,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const masterDefault = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'default',
          isTypeOnly: false,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const edges = [makeEdge(masterPath, './button.component.js')];

    const exportAllValue: TModuleExport[] = [
      {
        exportedName: '*',
        isTypeOnly: false,
        origin: { specifier: './button.component.js', type: 'export-all' },
        position: { column: 1, line: 1 },
      },
    ];

    const exportAllType: TModuleExport[] = [
      {
        exportedName: '*',
        isTypeOnly: true,
        origin: { specifier: './button.component.js', type: 'export-all' },
        position: { column: 1, line: 1 },
      },
    ];

    expect(
      isMasterReExported(exportAllValue, masterPath, masterNamed, edges)
    ).toBe(true);
    expect(
      isMasterReExported(exportAllValue, masterPath, masterDefault, edges)
    ).toBe(false);
    expect(
      isMasterReExported(exportAllType, masterPath, masterNamed, edges)
    ).toBe(false);

    const masterType = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'type' }],
      [
        {
          exportedName: 'Button',
          isTypeOnly: true,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );
    expect(
      isMasterReExported(exportAllType, masterPath, masterType, edges)
    ).toBe(true);
  });

  it('handles imported-binding exposure correctly', () => {
    const masterDefault = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'default',
          isTypeOnly: false,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const edges = [makeEdge(masterPath, './button.component.js')];

    const reExportDefault: TModuleExport[] = [
      {
        exportedName: 'PublicButton',
        isTypeOnly: false,
        origin: {
          importedName: 'default',
          specifier: './button.component.js',
          type: 'imported-binding',
        },
        position: { column: 1, line: 1 },
      },
    ];

    const reExportMismatch: TModuleExport[] = [
      {
        exportedName: 'Other',
        isTypeOnly: false,
        origin: {
          importedName: 'other',
          specifier: './button.component.js',
          type: 'imported-binding',
        },
        position: { column: 1, line: 1 },
      },
    ];

    const reExportTypeOnly: TModuleExport[] = [
      {
        exportedName: 'PublicButton',
        isTypeOnly: true,
        origin: {
          importedName: 'default',
          specifier: './button.component.js',
          type: 'imported-binding',
        },
        position: { column: 1, line: 1 },
      },
    ];

    expect(
      isMasterReExported(reExportDefault, masterPath, masterDefault, edges)
    ).toBe(true);
    expect(
      isMasterReExported(reExportMismatch, masterPath, masterDefault, edges)
    ).toBe(false);
    expect(
      isMasterReExported(reExportTypeOnly, masterPath, masterDefault, edges)
    ).toBe(false);
  });

  it('returns false for unrelated export types or non-matching destinations', () => {
    const masterNamed = makeRecord(
      [{ name: 'Button', position: { column: 1, line: 1 }, space: 'value' }],
      [
        {
          exportedName: 'Button',
          isTypeOnly: false,
          origin: { symbolName: 'Button', type: 'local-symbol' },
          position: { column: 1, line: 1 },
        },
      ]
    );

    const foreignEdges = [
      makeEdge('src/_components/other/index.ts', './other.js'),
    ];

    const namespaceExport: TModuleExport[] = [
      {
        exportedName: 'ns',
        isTypeOnly: false,
        origin: { specifier: './button.component.js', type: 'namespace' },
        position: { column: 1, line: 1 },
      },
    ];

    expect(
      isMasterReExported(namespaceExport, masterPath, masterNamed, [])
    ).toBe(false);

    const exportAllForeign: TModuleExport[] = [
      {
        exportedName: '*',
        isTypeOnly: false,
        origin: { specifier: './other.js', type: 'export-all' },
        position: { column: 1, line: 1 },
      },
    ];
    expect(
      isMasterReExported(
        exportAllForeign,
        masterPath,
        masterNamed,
        foreignEdges
      )
    ).toBe(false);
  });
});
