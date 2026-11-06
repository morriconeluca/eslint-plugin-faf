import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveRole,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function isViolatingNodeForm(
  classification: TItemClassification,
  taxonomy: TTaxonomyModel,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): boolean {
  if (
    classification.entryKind !== 'file' ||
    classification.nodeKind === null ||
    classification.nodeKind === 'foreign-node'
  ) {
    return false;
  }
  if (classification.role.kind === 'implicit') {
    return classification.nodeKind !== 'category-node';
  }

  const resolveParentRole = (): TEffectiveRole | undefined => {
    const item = inventory.items[classification.itemId];
    if (
      item === undefined ||
      typeof item.parentId !== 'number' ||
      item.treeOrigin === null
    ) {
      return undefined;
    }
    const parent = taxonomy.byItemId.get(item.parentId);
    if (parent === undefined) {
      return undefined;
    }
    const isContainer =
      parent.domainKind === 'category' || parent.domainKind === 'sub-category';
    if (!isContainer || parent.imposedRoleName === null) {
      return undefined;
    }
    const tree = trees.find(
      (candidate) => candidate.originPath === item.treeOrigin
    );
    return tree === undefined
      ? undefined
      : tree.catalog.roles.find(
          (candidate) => candidate.name === parent.imposedRoleName
        );
  };

  const parentRole = resolveParentRole();
  return (
    parentRole?.form === 'category-nodes' &&
    classification.nodeKind !== 'category-node'
  );
}
