import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareEdgeOutcomes } from '../_norms@shared/_utils/compare-edge-outcomes/index.js';

export function verifyForeignNodeIsolation(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { taxonomy } = model;

  for (const edge of model.graph.edgeMetadata) {
    const isSourceForeign =
      taxonomy.byPath.get(edge.sourcePath)?.nodeKind === 'foreign-node';
    const isDestinationForeign =
      taxonomy.byPath.get(edge.destinationPath)?.nodeKind === 'foreign-node';

    if (isSourceForeign || isDestinationForeign) {
      outcomes.push(
        createOutcome('dependency/foreign-node-isolation', {
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
