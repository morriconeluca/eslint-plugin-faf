import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { THorizontalHierarchies } from '../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../../../../_verify-project@shared/_utils/edge-geometry/index.js';
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
    inventory,
    taxonomy
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
