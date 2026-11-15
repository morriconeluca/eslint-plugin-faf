import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { compareEdgeOutcomes } from '../_norms@shared/_utils/compare-edge-outcomes/index.js';
import { checkEdgeAliasAnchoring } from './path-alias-anchoring.util.js';

export function verifyPathAliasAnchoring(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { aliases, inventory } = model.basis;
  const { taxonomy } = model;

  for (const edge of model.graph.edgeMetadata) {
    const outcome = checkEdgeAliasAnchoring(edge, inventory, taxonomy, aliases);
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
