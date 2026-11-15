import { describe, expect, it } from 'vitest';

import type { TEffectiveTree } from '../../../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { buildRootAuthorizationGraph } from './build-root-authorization-graph.util.js';

const makeTree = (
  originPath: string,
  rootFragments: TEffectiveTree['rootFragments']
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
  horizontalHierarchyModels: [],
  mimeticPathStructures: [],
  originKind: 'root-fragment',
  originPath,
  publicRootNodes: [],
  rootFragments,
  treeDependencyPairs: [],
});

describe('buildRootAuthorizationGraph', () => {
  it('builds empty graph for empty trees', () => {
    expect(buildRootAuthorizationGraph([]).fragmentCount).toBe(0);
  });

  it('flattens nested subRootFragments and deduplicates dependency edges while skipping self and unknown targets', () => {
    const graph = buildRootAuthorizationGraph([
      makeTree('src', [
        {
          dependencyPairs: [
            { from: 'src/main.ts', to: 'src/a/main.ts' },
            { from: 'src/main.ts', to: 'src/a/main.ts' },
            { from: 'src/main.ts', to: 'src/main.ts' },
            { from: 'src/main.ts', to: 'src/missing/main.ts' },
          ],
          path: 'src',
          rootNodes: [{ name: 'main.ts', rank: 0 }],
          subRootFragments: [
            {
              dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/main.ts' }],
              path: 'src/a',
              rootNodes: [{ name: 'main.ts', rank: 0 }],
              subRootFragments: [],
            },
          ],
        },
      ]),
    ]);

    expect(graph.fragmentCount).toBe(2);
    expect(graph.fragmentPaths).toEqual(['src', 'src/a']);
    expect(graph.adjacency).toEqual([[1], [0]]);
  });
});
