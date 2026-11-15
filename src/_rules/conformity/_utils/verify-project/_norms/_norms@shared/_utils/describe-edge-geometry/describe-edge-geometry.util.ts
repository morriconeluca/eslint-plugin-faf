import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TEdgeGeometry,
  TEdgeGeometryElement,
} from './describe-edge-geometry.type.js';

export function describeEdgeGeometry(
  source: TEdgeGeometryElement,
  destination: TEdgeGeometryElement,
  inventory: TInventory
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

  const collectAncestors = (
    item: TInventoryItem
  ): readonly TInventoryItem[] => {
    const chain: TInventoryItem[] = [];
    let current: TInventoryItem | undefined = item;
    while (current !== undefined) {
      chain.unshift(current);
      current =
        current.parentId === null
          ? undefined
          : inventory.items[current.parentId];
    }
    return chain;
  };

  const findLowestCommonAncestor = (
    sourceAncestors: readonly TInventoryItem[],
    destinationAncestors: readonly TInventoryItem[]
  ): number => {
    if (sourceAncestors[0]?.id !== destinationAncestors[0]?.id) {
      return -1;
    }

    let lcaIndex = 0;
    let nextSource = sourceAncestors[1];
    let nextDestination = destinationAncestors[1];
    while (
      nextSource !== undefined &&
      nextDestination !== undefined &&
      nextSource.id === nextDestination.id
    ) {
      lcaIndex += 1;
      nextSource = sourceAncestors[lcaIndex + 1];
      nextDestination = destinationAncestors[lcaIndex + 1];
    }
    return lcaIndex;
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

  const sourceAncestors = collectAncestors(sourceItem);
  const destinationAncestors = collectAncestors(destinationItem);

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
