import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_conformity@shared/_types/verification-model.type.js';

import { compareEdgeOutcomes } from '../_norms@shared/_utils/compare-edge-outcomes/index.js';
import { checkEdgePeerSeparation } from './peer-separation.util.js';

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
