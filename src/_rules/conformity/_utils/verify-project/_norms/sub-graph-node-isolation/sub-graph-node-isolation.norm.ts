import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareEdgeOutcomes } from '../_norms@shared/_utils/compare-edge-outcomes/index.js';

export function verifySubGraphNodeIsolation(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { inventory } = model.basis;
  const { taxonomy } = model;

  for (const edge of model.graph.edgeMetadata) {
    const destinationId = inventory.pathToId.get(edge.destinationPath);
    const destinationClassification =
      destinationId === undefined
        ? undefined
        : taxonomy.byItemId.get(destinationId);
    if (destinationClassification?.nodeKind !== 'sub-graph-node') {
      continue;
    }

    const sourceId = inventory.pathToId.get(edge.sourcePath);
    const sourceClassification =
      sourceId === undefined ? undefined : taxonomy.byItemId.get(sourceId);
    const isLogicalNode =
      sourceClassification !== undefined &&
      sourceClassification.nodeKind !== null &&
      sourceClassification.nodeKind !== 'foreign-node';

    if (isLogicalNode) {
      outcomes.push(
        createOutcome.edge('dependency/sub-graph-node-isolation', {
          from: edge.sourcePath,
          importIndex: edge.importIndex,
          position: edge.position,
          specifier: edge.specifier,
          to: edge.destinationPath,
        })
      );
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
