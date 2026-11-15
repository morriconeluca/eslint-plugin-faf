import type { TSourceLocation } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TQuotientGraph,
  TTransition,
} from './build-quotient-graph.type.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function buildQuotientGraph(model: TVerificationModel): TQuotientGraph {
  type TIndexedTransition = {
    readonly destinationPath: string;
    readonly sourcePath: string;
    readonly transition: TTransition;
  };

  const compareSegmentElements = (
    left: readonly string[],
    right: readonly string[]
  ): number => {
    for (const [index, leftElement] of left.entries()) {
      const rightElement = right[index];
      if (rightElement === undefined) {
        return 1;
      }
      const comparison = compareOrdinal(leftElement, rightElement);
      if (comparison !== 0) {
        return comparison;
      }
    }
    return left.length - right.length;
  };

  const compareEntries = (
    left: TIndexedTransition,
    right: TIndexedTransition
  ): number => {
    const sourceComparison = compareOrdinal(left.sourcePath, right.sourcePath);
    if (sourceComparison !== 0) {
      return sourceComparison;
    }

    const destinationComparison = compareOrdinal(
      left.destinationPath,
      right.destinationPath
    );
    return destinationComparison === 0
      ? compareSegmentElements(
          left.transition.segment,
          right.transition.segment
        )
      : destinationComparison;
  };

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

  const entries: (null | TIndexedTransition)[][] = Array.from(
    { length: treeCount },
    () => Array.from({ length: treeCount }, () => null)
  );

  const registerTransition = (
    sourcePath: string,
    destinationPath: string,
    segment: readonly string[],
    position?: TSourceLocation
  ): void => {
    const sourceTreeIndex = fileToTreeIndex.get(sourcePath);
    const destinationTreeIndex = fileToTreeIndex.get(destinationPath);
    if (
      sourceTreeIndex === undefined ||
      destinationTreeIndex === undefined ||
      sourceTreeIndex === destinationTreeIndex
    ) {
      return;
    }

    const candidate: TIndexedTransition = {
      destinationPath,
      sourcePath,
      transition: { position, segment },
    };
    const current = entries[sourceTreeIndex]?.[destinationTreeIndex];
    if (
      current !== null &&
      current !== undefined &&
      compareEntries(candidate, current) >= 0
    ) {
      return;
    }
    const row = entries[sourceTreeIndex];
    if (row !== undefined) {
      row[destinationTreeIndex] = candidate;
    }
  };

  for (const edge of model.graph.edgeMetadata) {
    registerTransition(
      edge.sourcePath,
      edge.destinationPath,
      [edge.sourcePath, edge.destinationPath],
      edge.position
    );
  }

  for (const crossing of model.crossings) {
    registerTransition(
      crossing.sourcePath,
      crossing.destinationPath,
      crossing.chain,
      crossing.position
    );
  }

  const transitions: (null | TTransition)[][] = entries.map((row) =>
    row.map((entry) => (entry === null ? null : entry.transition))
  );

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
