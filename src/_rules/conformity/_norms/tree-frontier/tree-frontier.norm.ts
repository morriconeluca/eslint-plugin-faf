import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_conformity@shared/_types/verification-model.type.js';

import {
  checkCrossingTreeAuthorization,
  checkEdgeTreeFrontier,
  compareTreeFrontierOutcomes,
} from './tree-frontier.util.js';

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
