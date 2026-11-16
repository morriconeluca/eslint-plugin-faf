import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_conformity@shared/_types/verification-model.type.js';

import { compareEdgeOutcomes } from '../_norms@shared/_utils/compare-edge-outcomes/index.js';
import { checkEdgeExternalDependency } from './external-dependencies.util.js';

export function verifyExternalDependencies(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { inventory } = model.basis;
  const { trees } = model.basis.declarations;
  const { graph, taxonomy } = model;

  const authorizedPairs = new Set<string>();
  for (const tree of trees) {
    for (const pair of tree.externalDependencyPairs) {
      authorizedPairs.add(`${tree.originPath}\0${pair.from}\0${pair.to}`);
    }
  }

  for (const edge of graph.edgeMetadata) {
    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
