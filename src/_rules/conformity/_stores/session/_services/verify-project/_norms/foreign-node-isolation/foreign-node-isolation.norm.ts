import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { checkEdgeIsolation } from './_utils/check-edge-isolation/index.js';
import { compareEdgeOutcomes } from './_utils/compare-edge-outcomes/index.js';

export function verifyForeignNodeIsolation(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const taxonomy = model.taxonomy;

  for (const edge of model.graph.edgeMetadata) {
    const outcome = checkEdgeIsolation(edge, taxonomy);
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
