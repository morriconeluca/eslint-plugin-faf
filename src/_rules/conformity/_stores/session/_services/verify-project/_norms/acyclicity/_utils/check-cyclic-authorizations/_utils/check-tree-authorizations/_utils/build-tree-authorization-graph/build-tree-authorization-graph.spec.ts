import { describe, expect, it } from 'vitest';

import type { TEffectiveTree } from '../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { buildTreeAuthorizationGraph } from './build-tree-authorization-graph.util.js';

const createTree = (
  originPath: string,
  pairs: readonly { from: string; to: string }[] = []
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 0,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-fragment',
  originPath,
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: pairs,
});

describe('buildTreeAuthorizationGraph', () => {
  it('builds empty auth graph for empty trees', () => {
    expect(buildTreeAuthorizationGraph([]).treeCount).toBe(0);
  });

  it('indexes tree dependency pairs and skips unknown trees or self-loops', () => {
    const trees = [
      createTree('a', [
        { from: 'a', to: 'b' },
        { from: 'a', to: 'a' },
        { from: 'a', to: 'unknown' },
        { from: 'unknown', to: 'b' },
      ]),
      createTree('b'),
    ];
    const graph = buildTreeAuthorizationGraph(trees);
    expect(graph.treeCount).toBe(2);
    expect(graph.adjacency[0]).toEqual([1]);
  });
});
