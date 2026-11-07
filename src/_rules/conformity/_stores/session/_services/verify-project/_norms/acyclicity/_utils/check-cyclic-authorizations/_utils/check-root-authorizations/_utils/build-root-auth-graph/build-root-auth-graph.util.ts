import type { TEffectiveTree } from '../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TRootAuthGraph } from './build-root-auth-graph.type.js';

import { compareOrdinal } from '../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { flattenRootFragments } from './_utils/flatten-root-fragments/index.js';
import { populateRootAuthAdjacency } from './_utils/populate-root-auth-adjacency/index.js';

export function buildRootAuthGraph(
  trees: readonly TEffectiveTree[]
): TRootAuthGraph {
  const allRootFragments = flattenRootFragments(
    trees.flatMap((tree) => tree.rootFragments)
  );

  const rawPaths = [...new Set(allRootFragments.map((f) => f.path))];
  const sortedPaths = [...rawPaths];
  sortedPaths.sort(compareOrdinal);
  const fragCount = sortedPaths.length;

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

  const adjacency: number[][] = Array.from({ length: fragCount }, () => []);
  const seenEdges = new Set<string>();

  populateRootAuthAdjacency(
    allRootFragments,
    pathToIndex,
    nodeToFragmentPath,
    adjacency,
    seenEdges
  );

  return {
    adjacency,
    allRootFragments,
    fragCount,
    fragmentPaths: sortedPaths,
    nodeToFragmentPath,
  };
}
