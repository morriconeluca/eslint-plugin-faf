import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { checkEdgeExternalDependency } from './_utils/check-edge-external-dependency/index.js';
import { compareEdgeOutcomes } from './_utils/compare-edge-outcomes/index.js';

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
