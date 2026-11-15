import { describe, expect, it } from 'vitest';

import { populateRootAuthorizationAdjacency } from './populate-root-authorization-adjacency.util.js';

describe('populateRootAuthorizationAdjacency', () => {
  it('populates adjacency from root fragment dependency pairs and deduplicates correctly', () => {
    const pathToIndex = new Map([
      ['src/a', 0],
      ['src/b', 1],
      ['src/c', 2],
    ]);
    const nodeToFragmentPath = new Map([
      ['src/b/main.ts', 'src/b'],
      ['src/c/main.ts', 'src/c'],
    ]);
    const adjacency: number[][] = [[], [], []];
    const seenEdges = new Set<string>();

    populateRootAuthorizationAdjacency(
      [
        {
          dependencyPairs: [
            { from: 'src/a/main.ts', to: 'src/b/main.ts' },
            { from: 'src/a/main.ts', to: 'src/b/main.ts' },
            { from: 'src/a/main.ts', to: 'src/c/main.ts' },
          ],
          path: 'src/a',
          rootNodes: [],
          subRootFragments: [],
        },
      ],
      pathToIndex,
      nodeToFragmentPath,
      adjacency,
      seenEdges
    );

    expect(adjacency[0]).toEqual([1, 2]);
  });

  it('skips unknown fragments, unknown targets, and self-edges', () => {
    const pathToIndex = new Map([['src/a', 0]]);
    const nodeToFragmentPath = new Map([['src/a/same.ts', 'src/a']]);
    const adjacency: number[][] = [[]];
    const seenEdges = new Set<string>();

    populateRootAuthorizationAdjacency(
      [
        {
          dependencyPairs: [
            { from: 'src/unknown/main.ts', to: 'src/a/main.ts' },
          ],
          path: 'src/unknown',
          rootNodes: [],
          subRootFragments: [],
        },
        {
          dependencyPairs: [
            { from: 'src/a/main.ts', to: 'src/unknown.ts' },
            { from: 'src/a/main.ts', to: 'src/a/same.ts' },
          ],
          path: 'src/a',
          rootNodes: [],
          subRootFragments: [],
        },
      ],
      pathToIndex,
      nodeToFragmentPath,
      adjacency,
      seenEdges
    );

    expect(adjacency[0]).toEqual([]);
  });
});
