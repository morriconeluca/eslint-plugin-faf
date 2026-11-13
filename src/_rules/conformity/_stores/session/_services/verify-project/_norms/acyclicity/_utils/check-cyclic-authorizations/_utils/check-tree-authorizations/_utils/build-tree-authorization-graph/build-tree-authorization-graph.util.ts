import type { TEffectiveTree } from '../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TTreeAuthorizationGraph } from './build-tree-authorization-graph.type.js';

import { compareOrdinal } from '../../../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { isAuthorizationEdgeValid } from './_utils/is-authorization-edge-valid/index.js';

export function buildTreeAuthorizationGraph(
  trees: readonly TEffectiveTree[]
): TTreeAuthorizationGraph {
  const treeOrigins = trees.map((t) => t.originPath);
  const sortedOrigins = [...treeOrigins];
  sortedOrigins.sort(compareOrdinal);
  const treeCount = sortedOrigins.length;

  const originToIndex = new Map<string, number>();
  for (const [index, origin] of sortedOrigins.entries()) {
    originToIndex.set(origin, index);
  }

  const adjacency: number[][] = Array.from({ length: treeCount }, () => []);
  const seenEdges = new Set<string>();

  for (const tree of trees) {
    for (const pair of tree.treeDependencyPairs) {
      const u = originToIndex.get(pair.from);
      const v = originToIndex.get(pair.to);
      if (
        u === undefined ||
        v === undefined ||
        !isAuthorizationEdgeValid(u, v, seenEdges)
      ) {
        continue;
      }
      seenEdges.add(`${u}\0${v}`);
      adjacency[u]?.push(v);
    }
  }

  return {
    adjacency,
    originToIndex,
    sortedOrigins,
    treeCount,
  };
}
