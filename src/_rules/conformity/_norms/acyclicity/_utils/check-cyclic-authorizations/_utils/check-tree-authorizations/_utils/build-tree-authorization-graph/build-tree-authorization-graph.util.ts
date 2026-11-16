import type { TEffectiveTree } from '../../../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TTreeAuthorizationGraph } from './build-tree-authorization-graph.type.js';

import { compareOrdinal } from '../../../../../../../../_conformity@shared/_utils/compare-ordinal/index.js';

export function buildTreeAuthorizationGraph(
  trees: readonly TEffectiveTree[]
): TTreeAuthorizationGraph {
  const treeOrigins = trees.map((tree) => tree.originPath);
  const sortedOrigins = [...treeOrigins];
  sortedOrigins.sort(compareOrdinal);
  const treeCount = sortedOrigins.length;

  const originToIndex = new Map<string, number>();
  for (const [index, origin] of sortedOrigins.entries()) {
    originToIndex.set(origin, index);
  }

  const adjacency: number[][] = Array.from({ length: treeCount }, () => []);
  const seenEdges = new Set<string>();

  const registerPair = (from: string, to: string): void => {
    const sourceIndex = originToIndex.get(from);
    const targetIndex = originToIndex.get(to);
    if (
      sourceIndex === undefined ||
      targetIndex === undefined ||
      sourceIndex === targetIndex
    ) {
      return;
    }
    const edgeKey = `${sourceIndex}\0${targetIndex}`;
    if (seenEdges.has(edgeKey)) {
      return;
    }
    seenEdges.add(edgeKey);
    adjacency[sourceIndex]?.push(targetIndex);
  };

  for (const tree of trees) {
    for (const pair of tree.treeDependencyPairs) {
      registerPair(pair.from, pair.to);
    }
  }

  return {
    adjacency,
    originToIndex,
    sortedOrigins,
    treeCount,
  };
}
