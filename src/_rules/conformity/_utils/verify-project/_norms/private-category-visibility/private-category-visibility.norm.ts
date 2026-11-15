import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { compareEdgeOutcomes } from '../_norms@shared/_utils/compare-edge-outcomes/index.js';
import {
  checkPrivateCategoryUnidirectionality,
  checkPrivateCategoryVisibility,
} from './private-category-visibility.util.js';

export function verifyPrivateCategoryVisibility(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { inventory } = model.basis;
  const { taxonomy } = model;

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
