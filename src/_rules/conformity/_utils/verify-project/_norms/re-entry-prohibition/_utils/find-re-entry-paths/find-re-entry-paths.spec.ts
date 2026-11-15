import { describe, expect, it } from 'vitest';

import type { TTransition } from './find-re-entry-paths.type.js';

import { findReEntryPaths } from './find-re-entry-paths.util.js';

const buildTransitions = (
  entries: readonly (readonly [string, TTransition])[]
): ReadonlyMap<string, readonly TTransition[]> => {
  const map = new Map<string, TTransition[]>();
  for (const [source, transition] of entries) {
    const list = map.get(source);
    if (list === undefined) {
      map.set(source, [transition]);
    } else {
      list.push(transition);
    }
  }
  return map;
};

const extension = (
  chain: readonly string[],
  options: {
    readonly column?: number;
    readonly importIndex?: number;
    readonly line?: number;
    readonly specifier?: string;
  } = {}
): readonly [string, TTransition] => [
  chain[0] ?? '',
  {
    chain,
    destinationPath: chain.at(-1) ?? '',
    hasExternal: true,
    importIndex: options.importIndex ?? 0,
    position: { column: options.column ?? 1, line: options.line ?? 1 },
    specifier: options.specifier ?? '../x.js',
    weight: chain.length - 1,
  },
];

const edge = (from: string, to: string): readonly [string, TTransition] => [
  from,
  {
    chain: [from, to],
    destinationPath: to,
    hasExternal: false,
    importIndex: 0,
    position: { column: 1, line: 1 },
    specifier: `./${to}.js`,
    weight: 1,
  },
];

const isTreeA = (path: string): boolean => path.startsWith('a/');

describe('findReEntryPaths', () => {
  it('returns empty array when there are no candidate sources', () => {
    expect(
      findReEntryPaths({
        candidateSources: [],
        isTargetTree: isTreeA,
        transitionsBySource: new Map(),
      })
    ).toEqual([]);
  });

  it('detects direct re-entry through one or multiple external files', () => {
    const matches = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts']),
      ]),
    });

    expect(matches).toEqual([
      {
        candidate: {
          chain: ['a/start.ts', 'x.ts', 'y.ts', 'a/end.ts'],
          destination: 'a/end.ts',
          distance: 3,
          importIndex: 0,
          position: { column: 1, line: 1 },
          specifier: '../x.js',
        },
        sourcePath: 'a/start.ts',
      },
    ]);
  });

  it('detects re-entry traversing another tree via crossings and internal graph edges', () => {
    const matches = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'b/entry.ts']),
        edge('b/entry.ts', 'b/exit.ts'),
        extension(['b/exit.ts', 'y.ts', 'a/end.ts']),
      ]),
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'x.ts',
      'b/entry.ts',
      'b/exit.ts',
      'y.ts',
      'a/end.ts',
    ]);
  });

  it('detects re-entry combining graph edge and crossing in either order', () => {
    const edgeThenExtension = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        edge('a/start.ts', 'b/mid.ts'),
        extension(['b/mid.ts', 'x.ts', 'a/end.ts']),
      ]),
    });
    expect(edgeThenExtension[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'b/mid.ts',
      'x.ts',
      'a/end.ts',
    ]);

    const extensionThenEdge = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'b/mid.ts']),
        edge('b/mid.ts', 'a/end.ts'),
      ]),
    });
    expect(extensionThenEdge[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'x.ts',
      'b/mid.ts',
      'a/end.ts',
    ]);
  });

  it('ignores pure inter-tree paths without any external crossing', () => {
    const matches = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        edge('a/start.ts', 'a/local.ts'),
        edge('a/start.ts', 'b/mid.ts'),
        edge('b/mid.ts', 'a/end.ts'),
      ]),
    });

    expect(matches).toEqual([]);
  });

  it('selects the shortest path and breaks ties by chain, position, importIndex, and specifier', () => {
    const byDistance = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'y1.ts', 'y2.ts', 'a/end.ts'], {
          importIndex: 0,
          line: 1,
          specifier: '../long.js',
        }),
        extension(['a/start.ts', 'x1.ts', 'a/end.ts'], {
          importIndex: 5,
          line: 9,
          specifier: '../short.js',
        }),
      ]),
    });
    expect(byDistance[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'x1.ts',
      'a/end.ts',
    ]);

    const byDistanceReverse = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x1.ts', 'a/end.ts'], {
          importIndex: 5,
          line: 9,
          specifier: '../short.js',
        }),
        extension(['a/start.ts', 'y1.ts', 'y2.ts', 'a/end.ts'], {
          importIndex: 0,
          line: 1,
          specifier: '../long.js',
        }),
      ]),
    });
    expect(byDistanceReverse[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'x1.ts',
      'a/end.ts',
    ]);

    const byChain = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'same.ts', 'beta.ts', 'a/end.ts']),
        extension(['a/start.ts', 'same.ts', 'alpha.ts', 'a/end.ts']),
      ]),
    });
    expect(byChain[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'same.ts',
      'alpha.ts',
      'a/end.ts',
    ]);

    const byChainAlreadyBest = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'same.ts', 'alpha.ts', 'a/end.ts']),
        extension(['a/start.ts', 'same.ts', 'beta.ts', 'a/end.ts']),
      ]),
    });
    expect(byChainAlreadyBest[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'same.ts',
      'alpha.ts',
      'a/end.ts',
    ]);

    const byPosition = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { column: 9, line: 5 }),
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { column: 2, line: 2 }),
      ]),
    });
    expect(byPosition[0]?.candidate.position).toEqual({ column: 2, line: 2 });

    const byPositionColumn = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { column: 9, line: 2 }),
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { column: 3, line: 2 }),
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { column: 5, line: 2 }),
      ]),
    });
    expect(byPositionColumn[0]?.candidate.position).toEqual({
      column: 3,
      line: 2,
    });

    const byImportIndex = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { importIndex: 2 }),
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { importIndex: 1 }),
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { importIndex: 3 }),
      ]),
    });
    expect(byImportIndex[0]?.candidate.importIndex).toBe(1);

    const bySpecifier = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { specifier: '../b.js' }),
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { specifier: '../a.js' }),
      ]),
    });
    expect(bySpecifier[0]?.candidate.specifier).toBe('../a.js');

    const bySpecifierAlreadyBest = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { specifier: '../a.js' }),
        extension(['a/start.ts', 'x.ts', 'a/end.ts'], { specifier: '../b.js' }),
      ]),
    });
    expect(bySpecifierAlreadyBest[0]?.candidate.specifier).toBe('../a.js');
  });

  it('handles cycles and prunes dominated external and non-external states', () => {
    const cyclic = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'b/one.ts']),
        edge('b/one.ts', 'b/two.ts'),
        edge('b/two.ts', 'b/one.ts'),
        extension(['b/two.ts', 'y.ts', 'a/end.ts']),
      ]),
    });
    expect(cyclic[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'x.ts',
      'b/one.ts',
      'b/two.ts',
      'y.ts',
      'a/end.ts',
    ]);

    const prunedNonExternal = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        edge('a/start.ts', 'b/one.ts'),
        edge('b/one.ts', 'b/end.ts'),
        edge('b/one.ts', 'b/loop.ts'),
        edge('b/loop.ts', 'b/end.ts'),
        extension(['b/end.ts', 'x.ts', 'a/target.ts']),
      ]),
    });
    expect(prunedNonExternal[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'b/one.ts',
      'b/end.ts',
      'x.ts',
      'a/target.ts',
    ]);

    const prunedExternal = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x1.ts', 'b/mid.ts'], { importIndex: 0 }),
        extension(['a/start.ts', 'x2.ts', 'b/entry.ts'], { importIndex: 1 }),
        edge('b/entry.ts', 'b/mid.ts'),
        extension(['b/mid.ts', 'y.ts', 'a/target.ts']),
      ]),
    });
    expect(prunedExternal[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'x1.ts',
      'b/mid.ts',
      'y.ts',
      'a/target.ts',
    ]);
  });

  it('orders priority queue states by distance then chain comparison', () => {
    const byDistance = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x2.ts', 'x3.ts', 'b/slow.ts'], {
          importIndex: 0,
        }),
        extension(['a/start.ts', 'x1.ts', 'b/quick.ts'], { importIndex: 1 }),
        extension(['b/quick.ts', 'y1.ts', 'a/target.ts']),
        extension(['b/slow.ts', 'y2.ts', 'a/target.ts']),
      ]),
    });
    expect(byDistance[0]?.candidate.chain).toEqual([
      'a/start.ts',
      'x1.ts',
      'b/quick.ts',
      'y1.ts',
      'a/target.ts',
    ]);

    const byChainOrder = findReEntryPaths({
      candidateSources: ['a/start.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'b/beta.ts'], { importIndex: 0 }),
        extension(['a/start.ts', 'x.ts', 'b/alpha.ts'], { importIndex: 1 }),
        edge('b/beta.ts', 'a/target-beta.ts'),
        edge('b/alpha.ts', 'a/target-alpha.ts'),
      ]),
    });
    expect(byChainOrder.map((match) => match.candidate.destination)).toEqual([
      'a/target-alpha.ts',
      'a/target-beta.ts',
    ]);

    const equalStateQueue = findReEntryPaths({
      candidateSources: ['a/start.ts', 'a/no-transitions.ts'],
      isTargetTree: isTreeA,
      transitionsBySource: buildTransitions([
        extension(['a/start.ts', 'x.ts', 'b/quick.ts'], { importIndex: 1 }),
        extension(['a/start.ts', 'x.ts', 'b/quick.ts'], { importIndex: 2 }),
        extension(['a/start.ts', 'x2.ts', 'x3.ts', 'b/slow.ts'], {
          importIndex: 3,
        }),
        edge('a/start.ts', 'b/alt1.ts'),
        edge('b/alt1.ts', 'b/mid.ts'),
        edge('a/start.ts', 'b/alt2.ts'),
        edge('b/alt2.ts', 'b/mid.ts'),
        extension(['b/quick.ts', 'y.ts', 'a/target-quick.ts']),
        extension(['b/slow.ts', 'y.ts', 'a/target-slow.ts']),
        extension(['b/mid.ts', 'y.ts', 'a/target-mid.ts']),
      ]),
    });
    expect(equalStateQueue.map((match) => match.candidate.destination)).toEqual(
      ['a/target-mid.ts', 'a/target-quick.ts', 'a/target-slow.ts']
    );
    expect(equalStateQueue[1]?.candidate.importIndex).toBe(1);
  });
});
