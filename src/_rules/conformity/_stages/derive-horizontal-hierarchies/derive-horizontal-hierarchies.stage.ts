import type { TOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveTree,
  THorizontalHierarchies,
  THorizontalHierarchySet,
  TProjectBasis,
  TTaxonomyModel,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';
import { deriveDomainHierarchies } from './_utils/derive-domain-hierarchies/index.js';
import { deriveNodeHierarchies } from './_utils/derive-node-hierarchies/index.js';

export function deriveHorizontalHierarchies(
  basis: TProjectBasis,
  taxonomy: TTaxonomyModel
): {
  readonly hierarchies: THorizontalHierarchies;
  readonly outcomes: readonly TOutcome[];
} {
  const trees: ReadonlyMap<null | string, TEffectiveTree> = new Map(
    basis.declarations.trees.map((tree) => [tree.originPath, tree])
  );
  const derivedSets: Omit<THorizontalHierarchySet, 'id'>[] = [];
  for (const parent of basis.inventory.items) {
    const tree = trees.get(parent.treeOrigin);
    if (tree === undefined || parent.kind !== 'directory') {
      continue;
    }
    const children = basis.inventory.items.filter(
      (item) => item.parentId === parent.id
    );
    const context = { children, parent, taxonomy, tree };
    derivedSets.push(
      ...deriveDomainHierarchies(context),
      ...deriveNodeHierarchies(context)
    );
  }
  const canonical = derivedSets.map((set) => {
    const siblings = [...set.siblings];
    siblings.sort((left, right) => {
      const rankOrder = left.rank - right.rank;
      return rankOrder === 0 ? left.itemId - right.itemId : rankOrder;
    });
    return { ...set, siblings };
  });
  canonical.sort((left, right) => {
    const parentOrder = compareOrdinal(left.parentPath, right.parentPath);
    return parentOrder === 0
      ? compareOrdinal(
          JSON.stringify([left.origin, left.repetitions, left.siblings]),
          JSON.stringify([right.origin, right.repetitions, right.siblings])
        )
      : parentOrder;
  });
  const sets = canonical.map((set, id) => ({ ...set, id }));
  const selections = new Map<number, Set<number>>();
  for (const set of sets) {
    for (const sibling of set.siblings) {
      const ids = selections.get(sibling.itemId) ?? new Set<number>();
      ids.add(set.id);
      selections.set(sibling.itemId, ids);
    }
  }
  const conflicts = [...selections]
    .filter(([, ids]) => ids.size > 1)
    .map(([itemId, ids]) => ({ hierarchyIds: [...ids], itemId }));
  conflicts.sort((left, right) => left.itemId - right.itemId);
  return { hierarchies: { conflicts, sets }, outcomes: [] };
}
