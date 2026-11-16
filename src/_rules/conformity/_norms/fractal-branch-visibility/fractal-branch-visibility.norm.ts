import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_conformity@shared/_types/verification-model.type.js';

import { compareEdgeOutcomes } from '../_norms@shared/_utils/compare-edge-outcomes/index.js';
import { checkBranchVisibility } from './fractal-branch-visibility.util.js';

export function verifyFractalBranchVisibility(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { inventory } = model.basis;
  const { taxonomy } = model;

  for (const edge of model.graph.edgeMetadata) {
    const outcome = checkBranchVisibility(edge, inventory, taxonomy);
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
