import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { checkEdgeRootDiscipline } from './_utils/check-edge-root-discipline/index.js';
import { compareEdgeOutcomes } from './_utils/compare-edge-outcomes/index.js';

export function verifyRootNodeDiscipline(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];

  for (const edge of model.graph.edgeMetadata) {
    const outcome = checkEdgeRootDiscipline(edge, model);
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
