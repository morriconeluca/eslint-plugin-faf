import type { THorizontalHierarchySet } from '../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type { THierarchyContext } from '../../_derive-horizontal-hierarchies@shared/_types/hierarchy-context.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { isOrderableSiblingSet } from './_utils/is-orderable-sibling-set/index.js';

export function deriveDomainHierarchies({
  children,
  parent,
  taxonomy,
  tree,
}: THierarchyContext): readonly Omit<THorizontalHierarchySet, 'id'>[] {
  const classification = taxonomy.byItemId.get(parent.id);
  const declarations = [
    ...(classification?.domainKind === 'foreign-domain'
      ? []
      : tree.horizontalHierarchies
    ).map((hierarchy) => ({
      hierarchy,
      origin: 'general' as const,
    })),
    ...tree.localHorizontalHierarchies
      .filter((local) => local.paths.includes(parent.path))
      .map((local) => ({
        hierarchy: local.hierarchy,
        origin: 'local' as const,
      })),
  ];
  const sets: Omit<THorizontalHierarchySet, 'id'>[] = [];
  for (const { hierarchy, origin } of declarations) {
    const names = hierarchy.flat();
    const repetitions = [
      ...new Set(names.filter((name, index) => names.indexOf(name) !== index)),
    ];
    repetitions.sort(compareOrdinal);
    const siblings = hierarchy.flatMap((tier, rank) => {
      const orderedNames = [...tier];
      orderedNames.sort(compareOrdinal);
      return orderedNames.flatMap((name) =>
        children
          .filter((child) => child.path.split('/').at(-1) === name)
          .map((child) => ({ itemId: child.id, rank }))
      );
    });
    if (origin === 'general' && siblings.length === 0) {
      continue;
    }
    sets.push({
      isOrderable: isOrderableSiblingSet(
        classification,
        siblings.map((sibling) => taxonomy.byItemId.get(sibling.itemId))
      ),
      origin,
      parentPath: parent.path,
      repetitions,
      siblings,
    });
  }
  return sets;
}
