import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type { TFragmentInspection } from '../../_fragment-anatomy@shared/_types/fragment-anatomy.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function collectFragmentItems(
  model: TVerificationModel
): readonly TFragmentInspection[] {
  const treeByOrigin = new Map<null | string, TEffectiveTree>(
    model.basis.declarations.trees.map((tree) => [tree.originPath, tree])
  );

  const fileChildrenByParentId = new Map<number, TInventoryItem[]>();
  for (const item of model.basis.inventory.items) {
    if (item.kind !== 'file' || item.parentId === null) {
      continue;
    }
    const list = fileChildrenByParentId.get(item.parentId) ?? [];
    list.push(item);
    fileChildrenByParentId.set(item.parentId, list);
  }

  const isFragmentClassification = (
    classification: TItemClassification | undefined
  ): classification is TItemClassification =>
    classification !== undefined &&
    classification.domainKind === 'fragment' &&
    classification.imposedRoleName !== null;

  const fragmentTargets: {
    readonly classification: TItemClassification;
    readonly item: TInventoryItem;
  }[] = [];

  for (const item of model.basis.inventory.items) {
    if (item.kind !== 'directory') {
      continue;
    }
    const classification = model.taxonomy.byItemId.get(item.id);
    if (isFragmentClassification(classification)) {
      fragmentTargets.push({ classification, item });
    }
  }

  const resolveMasterRank = (
    item: TInventoryItem,
    roleName: null | string
  ): null | number => {
    if (roleName === null) {
      return null;
    }
    const tree = treeByOrigin.get(item.treeOrigin);
    const imposedRole = tree?.catalog.roles.find(
      (role) => role.name === roleName
    );
    return imposedRole?.rank ?? null;
  };

  const toLogicalChild = (child: TInventoryItem): TItemClassification[] => {
    const childClassification = model.taxonomy.byItemId.get(child.id);
    return childClassification === undefined ||
      childClassification.nodeKind === null ||
      childClassification.nodeKind === 'foreign-node'
      ? []
      : [childClassification];
  };

  const inspections: TFragmentInspection[] = [];

  for (const { classification, item } of fragmentTargets) {
    const masterRank = resolveMasterRank(item, classification.imposedRoleName);

    const rawFileChildren = fileChildrenByParentId.get(item.id);
    const sortedChildren =
      rawFileChildren === undefined ? [] : [...rawFileChildren];
    sortedChildren.sort((left, right) => compareOrdinal(left.path, right.path));

    const logicalChildren = sortedChildren.flatMap((child) =>
      toLogicalChild(child)
    );

    inspections.push({
      fragmentClassification: classification,
      logicalChildren,
      masterRank,
    });
  }

  return inspections;
}
