import type { TEffectiveTree } from '../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TRootAuthorizationGraph } from './build-root-authorization-graph.type.js';

import { compareOrdinal } from '../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { flattenRootFragments } from './_utils/flatten-root-fragments/index.js';
import { populateRootAuthorizationAdjacency } from './_utils/populate-root-authorization-adjacency/index.js';

export function buildRootAuthorizationGraph(
  trees: readonly TEffectiveTree[]
): TRootAuthorizationGraph {
  const allRootFragments = flattenRootFragments(
    trees.flatMap((tree) => tree.rootFragments)
  );

  const rawPaths = [...new Set(allRootFragments.map((f) => f.path))];
  const sortedPaths = [...rawPaths];
  sortedPaths.sort(compareOrdinal);
  const fragmentCount = sortedPaths.length;

  const pathToIndex = new Map<string, number>();
  for (const [index, p] of sortedPaths.entries()) {
    pathToIndex.set(p, index);
  }

  const nodeToFragmentPath = new Map<string, string>();
  for (const fragment of allRootFragments) {
    for (const node of fragment.rootNodes) {
      const fullPath = `${fragment.path}/${node.name}`;
      nodeToFragmentPath.set(fullPath, fragment.path);
    }
  }

  const adjacency: number[][] = Array.from({ length: fragmentCount }, () => []);
  const seenEdges = new Set<string>();

  populateRootAuthorizationAdjacency(
    allRootFragments,
    pathToIndex,
    nodeToFragmentPath,
    adjacency,
    seenEdges
  );

  return {
    adjacency,
    allRootFragments,
    fragmentCount,
    fragmentPaths: sortedPaths,
    nodeToFragmentPath,
  };
}
