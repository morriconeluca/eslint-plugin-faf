import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { checkPrivateCategoryUnidirectionality } from './_utils/check-private-category-unidirectionality/index.js';
import { checkPrivateCategoryVisibility } from './_utils/check-private-category-visibility/index.js';
import { compareEdgeOutcomes } from './_utils/compare-edge-outcomes/index.js';

export function verifyPrivateCategoryVisibility(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const inventory = model.basis.inventory;
  const taxonomy = model.taxonomy;

  for (const edge of model.graph.edgeMetadata) {
    const visibilityOutcome = checkPrivateCategoryVisibility(
      edge,
      inventory,
      taxonomy
    );
    if (visibilityOutcome !== undefined) {
      outcomes.push(visibilityOutcome);
    }

    const unidirectionalityOutcome = checkPrivateCategoryUnidirectionality(
      edge,
      inventory,
      taxonomy
    );
    if (unidirectionalityOutcome !== undefined) {
      outcomes.push(unidirectionalityOutcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
