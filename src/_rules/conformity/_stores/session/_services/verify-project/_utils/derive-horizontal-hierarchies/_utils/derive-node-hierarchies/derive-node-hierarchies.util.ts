import type { THorizontalHierarchySet } from '../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type { THierarchyContext } from '../../_derive-horizontal-hierarchies@shared/_types/hierarchy-context.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function deriveNodeHierarchies({
  children,
  parent,
  taxonomy,
  tree,
}: THierarchyContext): readonly Omit<THorizontalHierarchySet, 'id'>[] {
  const kind = taxonomy.byItemId.get(parent.id)?.domainKind;
  if (kind === 'fragment') {
    const siblings = children.flatMap((child) => {
      const rank = taxonomy.byItemId.get(child.id)?.fragmentInternalRank;
      return rank === null || rank === undefined
        ? []
        : { itemId: child.id, rank };
    });
    return [
      {
        isOrderable: true,
        origin: 'fragment-internal',
        parentPath: parent.path,
        repetitions: [],
        siblings,
      },
    ];
  }
  if (kind !== 'root-fragment') {
    return [];
  }
  const fragments = [...tree.rootFragments];
  let fragment = fragments.shift();
  while (fragment !== undefined) {
    if (fragment.path === parent.path) {
      const rootNodes = fragment.rootNodes;
      const names = rootNodes.map((node) => node.name);
      const repetitions = [
        ...new Set(
          names.filter((name, index) => names.indexOf(name) !== index)
        ),
      ];
      repetitions.sort(compareOrdinal);
      const siblings = children.flatMap((child) =>
        rootNodes
          .filter((node) => node.name === child.path.split('/').at(-1))
          .map((node) => ({ itemId: child.id, rank: node.rank }))
      );
      return [
        {
          isOrderable: siblings.every(
            (sibling) =>
              taxonomy.byItemId.get(sibling.itemId)?.nodeKind === 'root-node'
          ),
          origin: 'root-nodes',
          parentPath: parent.path,
          repetitions,
          siblings,
        },
      ];
    }
    fragments.push(...fragment.subRootFragments);
    fragment = fragments.shift();
  }
  return [];
}
