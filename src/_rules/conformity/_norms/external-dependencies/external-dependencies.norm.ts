import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveOrientedPair,
  TVerificationModel,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { compareEdgeOutcomes } from '../_norms@shared/_utils/compare-edge-outcomes/index.js';
import { checkEdgeExternalDependency } from './external-dependencies.util.js';

export function verifyExternalDependencies(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { inventory } = model.basis;
  const { trees } = model.basis.declarations;
  const { graph, taxonomy } = model;

  const authorizedByTree = new Map<string, readonly TEffectiveOrientedPair[]>(
    trees.map((tree) => [tree.originPath, tree.externalDependencyPairs])
  );

  for (const edge of graph.edgeMetadata) {
    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedByTree
    );
    if (outcome !== undefined) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort(compareEdgeOutcomes);
  return outcomes;
}
