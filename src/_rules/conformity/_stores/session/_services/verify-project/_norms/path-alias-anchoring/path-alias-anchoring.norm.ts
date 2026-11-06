import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { checkEdgeAliasAnchoring } from './_utils/check-edge-alias-anchoring/index.js';
import { compareEdgeOutcomes } from './_utils/compare-edge-outcomes/index.js';

export function verifyPathAliasAnchoring(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { aliases, inventory } = model.basis;
  const taxonomy = model.taxonomy;

  for (const edge of model.graph.edgeMetadata) {
    const outcome = checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases);
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
