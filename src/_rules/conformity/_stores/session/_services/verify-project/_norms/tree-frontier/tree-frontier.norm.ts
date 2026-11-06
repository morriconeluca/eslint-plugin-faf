import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { checkCrossingTreeAuthorization } from './_utils/check-crossing-tree-authorization/index.js';
import { checkEdgeTreeFrontier } from './_utils/check-edge-tree-frontier/index.js';
import { compareTreeFrontierOutcomes } from './_utils/compare-tree-frontier-outcomes/index.js';

export function verifyTreeFrontier(
  model: TVerificationModel
): readonly TOutcome[] {
  const { inventory } = model.basis;
  const { trees } = model.basis.declarations;
  const { crossings, graph, surface } = model;

  const publicNodes = new Set<string>();
  for (const treeSurface of surface.trees) {
    for (const node of treeSurface.nodes) {
      publicNodes.add(node);
    }
  }

  const authorizedTreePairs = new Set<string>();
  for (const tree of trees) {
    for (const pair of tree.treeDependencyPairs) {
      authorizedTreePairs.add(`${pair.from}\0${pair.to}`);
    }
  }

  const outcomes: TDependencyOutcome[] = [];

  for (const edge of graph.edgeMetadata) {
    const edgeOutcomes = checkEdgeTreeFrontier(
      edge,
      inventory,
      publicNodes,
      authorizedTreePairs
    );
    for (const outcome of edgeOutcomes) {
      outcomes.push(outcome);
    }
  }

  for (const crossing of crossings) {
    const crossingOutcome = checkCrossingTreeAuthorization(
      crossing,
      inventory,
      authorizedTreePairs
    );
    if (crossingOutcome !== undefined) {
      outcomes.push(crossingOutcome);
    }
  }

  outcomes.sort(compareTreeFrontierOutcomes);
  return outcomes;
}
