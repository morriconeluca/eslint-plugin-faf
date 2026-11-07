import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { orderModuleCollection } from './order-module-collection.util.js';

const record = (language: TModuleRecord['language']): TModuleRecord => ({
  exports: [],
  imports: [],
  language,
  symbols: [],
  unsupportedSyntaxes: [],
});

describe('orderModuleCollection', () => {
  it('orders map keys and unverified outcomes independently of insertion order', () => {
    const recordPairs = 'src/z.ts,src/a.ts'
      .split(',')
      .map((path) => [
        path,
        record(path.endsWith('z.ts') ? 'script' : 'binary'),
      ]) satisfies [string, TModuleRecord][];
    const zResolutions: readonly TImportResolution[] = [
      {
        aliasAlternatives: [],
        aliasUsed: null,
        importIndex: 1,
        sourcePath: 'src/z.ts',
        target: { path: 'src/b.ts', type: 'local-file' },
      },
      {
        aliasAlternatives: [],
        aliasUsed: null,
        importIndex: 0,
        sourcePath: 'src/z.ts',
        target: { packageName: 'left-pad', type: 'external-library' },
      },
    ];
    const resolutionPairs: [string, readonly TImportResolution[]][] = [
      ['src/z.ts', zResolutions],
      ['src/a.ts', []],
    ];

    const ordered = orderModuleCollection({
      records: new Map(recordPairs),
      resolutions: new Map(resolutionPairs),
      unverifiedOutcomes: [
        {
          constraint: 'unverified/unresolved-import',
          element: 'src/z.ts',
          family: 'unverified',
          message: 'later',
          normativeReference: '§5',
          reason: 'later',
        },
        {
          constraint: 'unverified/unreadable-entry',
          element: 'src/a.ts',
          family: 'unverified',
          message: 'earlier',
          normativeReference: '§6',
          reason: 'earlier',
        },
      ],
    });

    expect(ordered.records.keys().next().value).toBe('src/a.ts');
    expect(ordered.resolutions.keys().next().value).toBe('src/a.ts');
    expect(
      ordered.resolutions.get('src/z.ts')?.map((item) => item.importIndex)
    ).toEqual([1, 0]);
    expect(ordered.unverifiedOutcomes.map((item) => item.element)).toEqual([
      'src/a.ts',
      'src/z.ts',
    ]);
  });
});
