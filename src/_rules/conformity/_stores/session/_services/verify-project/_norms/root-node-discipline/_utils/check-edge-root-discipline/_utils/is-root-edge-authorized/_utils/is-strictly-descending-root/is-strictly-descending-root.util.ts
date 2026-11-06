import type { THorizontalHierarchies } from '../../../../../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';

export function isStrictlyDescendingRoot(
  sourceId: number,
  destinationId: number,
  parentPath: string,
  hierarchies: THorizontalHierarchies
): boolean {
  const hierarchySet = hierarchies.sets.find(
    (set) => set.origin === 'root-nodes' && set.parentPath === parentPath
  );
  if (
    hierarchySet === undefined ||
    !hierarchySet.isOrderable ||
    hierarchySet.repetitions.length > 0
  ) {
    return false;
  }

  const conflictingIds = new Set(
    hierarchies.conflicts.map((conflict) => conflict.itemId)
  );
  if (conflictingIds.has(sourceId) || conflictingIds.has(destinationId)) {
    return false;
  }

  const sourceSiblings = hierarchySet.siblings.filter(
    (sibling) => sibling.itemId === sourceId
  );
  const destinationSiblings = hierarchySet.siblings.filter(
    (sibling) => sibling.itemId === destinationId
  );
  if (sourceSiblings.length !== 1 || destinationSiblings.length !== 1) {
    return false;
  }

  const sourceSibling = sourceSiblings[0];
  const destinationSibling = destinationSiblings[0];
  return (
    sourceSibling !== undefined &&
    destinationSibling !== undefined &&
    sourceSibling.rank > destinationSibling.rank
  );
}
