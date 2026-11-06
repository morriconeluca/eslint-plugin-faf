import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { checkEdgePeerSeparation } from './_utils/check-edge-peer-separation/index.js';
import { compareEdgeOutcomes } from './_utils/compare-edge-outcomes/index.js';

export function verifyPeerSeparation(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { basis, hierarchies, taxonomy } = model;
  const { inventory } = basis;

  for (const edge of model.graph.edgeMetadata) {
    const outcome = checkEdgePeerSeparation(
      edge,
      inventory,
      taxonomy,
      hierarchies
    );
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
