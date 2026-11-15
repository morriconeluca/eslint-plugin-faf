import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TQuotientGraph,
  TTransition,
} from './build-quotient-graph.type.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { populateTreeTransitions } from './_utils/populate-tree-transitions/index.js';

export function buildQuotientGraph(model: TVerificationModel): TQuotientGraph {
  const treeOrigins = model.basis.declarations.trees.map(
    (tree) => tree.originPath
  );
  treeOrigins.sort(compareOrdinal);
  const treeCount = treeOrigins.length;

  const originToIndex = new Map<string, number>();
  for (const [index, origin] of treeOrigins.entries()) {
    originToIndex.set(origin, index);
  }

  const fileToTreeIndex = new Map<string, number>();
  for (const item of model.basis.inventory.items) {
    const treeIndex =
      item.treeOrigin === null ? undefined : originToIndex.get(item.treeOrigin);
    if (treeIndex !== undefined) {
      fileToTreeIndex.set(item.path, treeIndex);
    }
  }

  const transitions: (null | TTransition)[][] = Array.from(
    { length: treeCount },
    () => Array.from({ length: treeCount }, () => null)
  );

  populateTreeTransitions(model, fileToTreeIndex, transitions);

  const adjacency: number[][] = transitions.map((row) => {
    const neighbors: number[] = [];
    for (const [destinationIndex, transition] of row.entries()) {
      if (transition !== null) {
        neighbors.push(destinationIndex);
      }
    }
    return neighbors;
  });

  return {
    adjacency,
    originToIndex,
    transitions,
    treeCount,
    treeOrigins,
  };
}
