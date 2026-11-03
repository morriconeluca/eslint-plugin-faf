import { describe, expect, it } from 'vitest';

import type { TImportResolution } from '../../../../../../../../../_graph/_types/dependency-graph.type.js';
import type { TModuleRecord } from '../../../../../../../../../_syntax/_types/module-record.type.js';

import { collectRecordUnverifiedOutcomes } from './index.js';

const record = (
  imports: TModuleRecord['imports'],
  unsupportedSyntaxes: TModuleRecord['unsupportedSyntaxes']
): TModuleRecord => ({
  exports: [],
  imports,
  language: 'script',
  symbols: [],
  unsupportedSyntaxes,
});

const unresolved = (
  importIndex: number,
  reason: string
): TImportResolution => ({
  aliasAlternatives: [],
  aliasUsed: null,
  importIndex,
  sourcePath: 'src/app.ts',
  target: { reason, type: 'unresolved' },
});

describe('collectRecordUnverifiedOutcomes', () => {
  it('collects unresolved imports and unsupported syntax and skips resolved targets', () => {
    const resolutions: readonly TImportResolution[] = [
      {
        aliasAlternatives: [],
        aliasUsed: null,
        importIndex: 0,
        sourcePath: 'src/app.ts',
        target: { path: 'src/ok.ts', type: 'local-file' },
      },
      unresolved(1, 'missing'),
      {
        aliasAlternatives: [],
        aliasUsed: null,
        importIndex: 2,
        sourcePath: 'src/app.ts',
        target: { packageName: 'left-pad', type: 'external-library' },
      },
    ];
    const outcomes = collectRecordUnverifiedOutcomes(
      'src/app.ts',
      record(
        [
          {
            isTypeOnly: false,
            kind: 'named-import',
            position: { column: 1, line: 1 },
            specifier: './ok.ts',
          },
          {
            isTypeOnly: false,
            kind: 'named-import',
            position: { column: 1, line: 2 },
            specifier: './missing.ts',
          },
        ],
        [
          {
            description: 'export = is unsupported',
            position: { column: 1, line: 4 },
          },
        ]
      ),
      resolutions
    );
    expect(outcomes).toEqual([
      {
        constraint: 'unverified/unresolved-import',
        element: 'src/app.ts',
        family: 'unverified',
        message: "Import in 'src/app.ts' could not be resolved: missing",
        normativeReference: '§5',
        position: { column: 1, line: 2 },
        reason: 'missing',
      },
      {
        constraint: 'unverified/unsupported-syntax',
        element: 'src/app.ts',
        family: 'unverified',
        message: "Unsupported syntax in 'src/app.ts': export = is unsupported",
        normativeReference: '§4',
        position: { column: 1, line: 4 },
        reason: 'export = is unsupported',
      },
    ]);
  });

  it('marks a non-literal dynamic import without using the unresolved reason as the constraint', () => {
    const outcomes = collectRecordUnverifiedOutcomes(
      'src/app.ts',
      record(
        [
          {
            isTypeOnly: false,
            kind: 'non-literal-dynamic-import',
            position: { column: 4, line: 2 },
            specifier: null,
          },
        ],
        []
      ),
      [
        unresolved(
          0,
          'Non-literal dynamic import cannot be resolved statically'
        ),
      ]
    );
    expect(outcomes).toEqual([
      {
        constraint: 'unverified/non-literal-dynamic-import',
        element: 'src/app.ts',
        family: 'unverified',
        message:
          "Non-literal dynamic import in 'src/app.ts' cannot be resolved statically.",
        normativeReference: '§4',
        position: { column: 4, line: 2 },
        reason: 'Non-literal dynamic import cannot be resolved statically',
      },
    ]);
  });

  it('omits position when the unresolved import index does not exist', () => {
    expect(
      collectRecordUnverifiedOutcomes('src/app.ts', record([], []), [
        unresolved(3, 'Cannot resolve module missing'),
      ])
    ).toEqual([
      {
        constraint: 'unverified/unresolved-import',
        element: 'src/app.ts',
        family: 'unverified',
        message:
          "Import in 'src/app.ts' could not be resolved: Cannot resolve module missing",
        normativeReference: '§5',
        reason: 'Cannot resolve module missing',
      },
    ]);
  });

  it('returns no outcomes when every resolution is available and syntax is supported', () => {
    expect(
      collectRecordUnverifiedOutcomes('src/app.ts', record([], []), [
        {
          aliasAlternatives: [],
          aliasUsed: null,
          importIndex: 0,
          sourcePath: 'src/app.ts',
          target: { packageName: 'left-pad', type: 'external-library' },
        },
      ])
    ).toEqual([]);
  });
});
