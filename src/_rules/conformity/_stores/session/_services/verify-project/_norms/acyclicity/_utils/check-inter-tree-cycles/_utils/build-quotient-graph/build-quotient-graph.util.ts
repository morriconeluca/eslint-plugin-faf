import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type {
  TQuotientGraph,
  TTransition,
} from './build-quotient-graph.type.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { populateTreeTransitions } from './_utils/populate-tree-transitions/index.js';

export function buildQuotientGraph(model: TVerificationModel): TQuotientGraph {
  const treeOrigins = model.basis.declarations.trees.map((t) => t.originPath);
  const sortedOrigins = [...treeOrigins];
  sortedOrigins.sort(compareOrdinal);
  const treeCount = sortedOrigins.length;

  const originToIndex = new Map<string, number>();
  for (let index = 0; index < treeCount; index += 1) {
    const origin = sortedOrigins[index];
    if (origin !== undefined) {
      originToIndex.set(origin, index);
    }
  }

  const fileToTreeIndex = new Map<string, number>();
  for (const item of model.basis.inventory.items) {
    if (item.treeOrigin === null) {
      continue;
    }
    const treeIndex = originToIndex.get(item.treeOrigin);
    if (treeIndex !== undefined) {
      fileToTreeIndex.set(item.path, treeIndex);
    }
  }

  const transitions: (null | TTransition)[][] = Array.from(
    { length: treeCount },
    () => Array.from({ length: treeCount }, () => null)
  );

  populateTreeTransitions(model, fileToTreeIndex, transitions);

  const adjacency: number[][] = Array.from({ length: treeCount }, () => []);

  for (let u = 0; u < treeCount; u += 1) {
    for (let v = 0; v < treeCount; v += 1) {
      if (u !== v && transitions[u]?.[v] !== null) {
        adjacency[u]?.push(v);
      }
    }
  }

  return {
    adjacency,
    originToIndex,
    transitions,
    treeCount,
    treeOrigins: sortedOrigins,
  };
}
