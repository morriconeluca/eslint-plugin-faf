import type { TTaxonomyModel } from '../../_types/_compounds/classification.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_types/_primitives/inventory.type.js';
import type {
  TEdgeGeometry,
  TEdgeGeometryElement,
} from './edge-geometry.type.js';

import { collectAncestors } from './_utils/collect-ancestors/index.js';
import { findLowestCommonAncestor } from './_utils/find-lowest-common-ancestor/index.js';

export function describeEdgeGeometry(
  source: TEdgeGeometryElement,
  destination: TEdgeGeometryElement,
  inventory: TInventory,
  _taxonomy?: TTaxonomyModel
): TEdgeGeometry {
  const interTreeGeometry = (): TEdgeGeometry => ({
    descendingDomains: [],
    differentTrees: true,
    firstStepDestination: null,
    firstStepSource: null,
    isSourceInside: () => false,
    lowestCommonAncestor: null,
    sameTree: false,
  });

  const resolveItem = (
    element: TEdgeGeometryElement
  ): TInventoryItem | undefined => {
    if (typeof element === 'number') {
      return inventory.items[element];
    }
    if (typeof element === 'string') {
      const id = inventory.pathToId.get(element);
      return id === undefined ? undefined : inventory.items[id];
    }
    return element;
  };

  const sourceItem = resolveItem(source);
  const destinationItem = resolveItem(destination);

  if (sourceItem === undefined || destinationItem === undefined) {
    return interTreeGeometry();
  }

  const sourceOrigin = sourceItem.treeOrigin;
  if (sourceOrigin === null || sourceOrigin !== destinationItem.treeOrigin) {
    return interTreeGeometry();
  }

  const sourceAncestors = collectAncestors(sourceItem, inventory);
  const destinationAncestors = collectAncestors(destinationItem, inventory);

  const lcaIndex = findLowestCommonAncestor(
    sourceAncestors,
    destinationAncestors
  );
  const lowestCommonAncestor = sourceAncestors[lcaIndex];
  if (lcaIndex === -1 || lowestCommonAncestor === undefined) {
    return interTreeGeometry();
  }

  const firstStepSource = sourceAncestors[lcaIndex + 1] ?? null;
  const firstStepDestination = destinationAncestors[lcaIndex + 1] ?? null;

  const descendingDomains = destinationAncestors
    .slice(lcaIndex + 1)
    .filter((step) => step.kind === 'directory');

  const isSourceInside = (domain: TInventoryItem): boolean =>
    sourceItem.treeOrigin === domain.treeOrigin &&
    domain.preorderStart <= sourceItem.preorderStart &&
    sourceItem.preorderEnd <= domain.preorderEnd;

  return {
    descendingDomains,
    differentTrees: false,
    firstStepDestination,
    firstStepSource,
    isSourceInside,
    lowestCommonAncestor,
    sameTree: true,
  };
}
