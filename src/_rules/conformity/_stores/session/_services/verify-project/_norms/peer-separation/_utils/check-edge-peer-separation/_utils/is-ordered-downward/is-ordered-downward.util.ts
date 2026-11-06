import type { THorizontalHierarchies } from '../../../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';

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
    const sourceRanks = set.siblings.filter((s) => s.itemId === sourceItemId);
    const destinationRanks = set.siblings.filter(
      (s) => s.itemId === destinationItemId
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
