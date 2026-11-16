import type { TDependencyOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  THorizontalHierarchies,
  TInventory,
  TItemClassification,
  TTaxonomyModel,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../_norms@shared/_utils/describe-edge-geometry/index.js';

const NON_PEER_DOMAINS = new Set(['foreign-domain', 'root-fragment']);

const NON_PEER_NODES = new Set([
  'foreign-node',
  'root-node',
  'unauthorized-logical-node',
]);

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

  return createOutcome.edge('dependency/peer-separation', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}

export function isOrderedDownward(
  sourceItemId: number,
  destinationItemId: number,
  lowestCommonAncestorPath: string,
  hierarchies: THorizontalHierarchies
): boolean {
  const hasConflict = hierarchies.conflicts.some(
    (conflict) =>
      conflict.itemId === sourceItemId || conflict.itemId === destinationItemId
  );
  if (hasConflict) {
    return false;
  }

  return hierarchies.sets.some((set) => {
    if (!set.isOrderable || set.parentPath !== lowestCommonAncestorPath) {
      return false;
    }
    const sourceRanks = set.siblings.filter(
      (sibling) => sibling.itemId === sourceItemId
    );
    const destinationRanks = set.siblings.filter(
      (sibling) => sibling.itemId === destinationItemId
    );
    if (sourceRanks.length !== 1 || destinationRanks.length !== 1) {
      return false;
    }
    const sourceSibling = sourceRanks[0];
    const destinationSibling = destinationRanks[0];
    return (
      sourceSibling !== undefined &&
      destinationSibling !== undefined &&
      sourceSibling.rank > destinationSibling.rank
    );
  });
}

export function isPeerDomain(
  classification: TItemClassification | undefined
): classification is TItemClassification {
  const kind = classification?.domainKind;
  return kind !== null && kind !== undefined && !NON_PEER_DOMAINS.has(kind);
}

export function isPeerNode(
  classification: TItemClassification | undefined
): classification is TItemClassification {
  const kind = classification?.nodeKind;
  return kind !== null && kind !== undefined && !NON_PEER_NODES.has(kind);
}

export function isPeerPair(
  sourceStepId: number,
  destinationStepId: number,
  taxonomy: TTaxonomyModel
): boolean {
  const sourceClassification = taxonomy.byItemId.get(sourceStepId);
  const destinationClassification = taxonomy.byItemId.get(destinationStepId);

  const areBothDomains =
    isPeerDomain(sourceClassification) &&
    isPeerDomain(destinationClassification) &&
    destinationClassification.domainKind !== 'fractal-branch';

  const areBothNodes =
    isPeerNode(sourceClassification) && isPeerNode(destinationClassification);

  return areBothDomains || areBothNodes;
}
