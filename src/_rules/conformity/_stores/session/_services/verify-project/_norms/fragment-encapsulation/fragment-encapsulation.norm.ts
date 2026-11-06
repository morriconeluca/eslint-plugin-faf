import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { checkEdgeEncapsulation } from './_utils/check-edge-encapsulation/index.js';
import { compareEdgeOutcomes } from './_utils/compare-edge-outcomes/index.js';

export function verifyFragmentEncapsulation(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const inventory = model.basis.inventory;
  const taxonomy = model.taxonomy;

  for (const edge of model.graph.edgeMetadata) {
    const outcome = checkEdgeEncapsulation(edge, inventory, taxonomy);
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
