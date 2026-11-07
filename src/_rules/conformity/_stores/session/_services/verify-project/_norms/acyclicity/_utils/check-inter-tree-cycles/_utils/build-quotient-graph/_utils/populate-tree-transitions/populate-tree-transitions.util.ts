import type { TSourceLocation } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type { TTransition } from './populate-tree-transitions.type.js';

import { compareSegments } from './_utils/compare-segments/index.js';

export function populateTreeTransitions(
  model: TVerificationModel,
  fileToTreeIndex: ReadonlyMap<string, number>,
  transitions: (null | TTransition)[][]
): void {
  const registerTransition = (
    sourceTreeIndex: number,
    destinationTreeIndex: number,
    segment: readonly string[],
    position?: TSourceLocation
  ): void => {
    const current = transitions[sourceTreeIndex]?.[destinationTreeIndex];
    if (
      current !== null &&
      current !== undefined &&
      compareSegments(segment, current.segment) >= 0
    ) {
      return;
    }
    const row = transitions[sourceTreeIndex];
    if (row !== undefined) {
      row[destinationTreeIndex] = { position, segment };
    }
  };

  for (const edge of model.graph.edgeMetadata) {
    const sourceTreeIndex = fileToTreeIndex.get(edge.sourcePath);
    const destinationTreeIndex = fileToTreeIndex.get(edge.destinationPath);
    if (
      sourceTreeIndex !== undefined &&
      destinationTreeIndex !== undefined &&
      sourceTreeIndex !== destinationTreeIndex
    ) {
      registerTransition(
        sourceTreeIndex,
        destinationTreeIndex,
        [edge.sourcePath, edge.destinationPath],
        edge.position
      );
    }
  }

  for (const crossing of model.crossings) {
    const sourceTreeIndex = fileToTreeIndex.get(crossing.sourcePath);
    const destinationTreeIndex = fileToTreeIndex.get(crossing.destinationPath);
    if (
      sourceTreeIndex !== undefined &&
      destinationTreeIndex !== undefined &&
      sourceTreeIndex !== destinationTreeIndex
    ) {
      registerTransition(
        sourceTreeIndex,
        destinationTreeIndex,
        crossing.chain,
        crossing.position
      );
    }
  }
}
