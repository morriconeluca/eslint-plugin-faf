import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TEffectiveRole,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function isViolatingDirectoryRole(
  classification: TItemClassification,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): boolean {
  if (
    classification.entryKind !== 'directory' ||
    classification.domainKind !== 'fragment' ||
    classification.imposedRoleName === null
  ) {
    return false;
  }

  const item = inventory.items[classification.itemId];
  if (item === undefined || item.treeOrigin === null) {
    return false;
  }

  const tree = trees.find(
    (candidate) => candidate.originPath === item.treeOrigin
  );
  if (tree === undefined) {
    return false;
  }

  let matchingRole: TEffectiveRole | undefined;
  for (const role of tree.catalog.roles) {
    if (role.name === classification.imposedRoleName) {
      matchingRole = role;
    }
  }

  return matchingRole?.form === 'category-nodes';
}
