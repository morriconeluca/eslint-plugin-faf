import { describe, expect, it } from 'vitest';

import type { TEdgeMetadata } from '../../../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { populateAdjacencyEdges } from './index.js';

const createEdge = (
  sourcePath: string,
  destinationPath: string
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier: `./${destinationPath}`,
  syntaxKind: 'side-effect-import',
});

describe('populateAdjacencyEdges', () => {
  it('populates edges into adjacency and self-loops', () => {
    const pathToIndex = new Map([
      ['src/a.ts', 0],
      ['src/b.ts', 1],
    ]);
    const adjacency: number[][] = [[], []];
    const revAdjacency: number[][] = [[], []];
    const selfLoopSet = new Set<number>();
    const edgeBySourceAndDestination = new Map<string, TEdgeMetadata>();

    populateAdjacencyEdges(
      [createEdge('src/a.ts', 'src/b.ts'), createEdge('src/b.ts', 'src/a.ts')],
      pathToIndex,
      adjacency,
      revAdjacency,
      selfLoopSet,
      edgeBySourceAndDestination
    );

    expect(adjacency[0]).toEqual([1]);
    expect(revAdjacency[1]).toEqual([0]);
    expect(selfLoopSet.has(1)).toBe(false);
  });
});
