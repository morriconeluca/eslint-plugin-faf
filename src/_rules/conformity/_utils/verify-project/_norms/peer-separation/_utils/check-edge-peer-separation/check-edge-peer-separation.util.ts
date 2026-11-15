import type { TDependencyOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  THorizontalHierarchies,
  TInventory,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../../../_norms@shared/_utils/describe-edge-geometry/index.js';
import { isOrderedDownward } from './_utils/is-ordered-downward/index.js';
import { isPeerPair } from './_utils/is-peer-pair/index.js';

export function checkEdgePeerSeparation(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel,
  hierarchies: THorizontalHierarchies
): TDependencyOutcome | undefined {
  const geometry = describeEdgeGeometry(
    edge.sourcePath,
    edge.destinationPath,
    inventory
  );

  if (
    !geometry.sameTree ||
    geometry.firstStepSource === null ||
    geometry.firstStepDestination === null
  ) {
    return undefined;
  }

  const sourceStep = geometry.firstStepSource;
  const destinationStep = geometry.firstStepDestination;

  if (
    !isPeerPair(sourceStep.id, destinationStep.id, taxonomy) ||
    isOrderedDownward(
      sourceStep.id,
      destinationStep.id,
      geometry.lowestCommonAncestor.path,
      hierarchies
    )
  ) {
    return undefined;
  }

  return createOutcome('dependency/peer-separation', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}
