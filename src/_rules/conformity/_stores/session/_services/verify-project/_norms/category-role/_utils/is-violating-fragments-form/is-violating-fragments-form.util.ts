import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function isViolatingFragmentsForm(
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

  const item = inventory.items[classification.itemId];
  if (
    item === undefined ||
    typeof item.parentId !== 'number' ||
    item.treeOrigin === null
  ) {
    return false;
  }
  const parent = taxonomy.byItemId.get(item.parentId);
  if (typeof parent?.imposedRoleName !== 'string') {
    return false;
  }
  const tree = trees.find((t) => t.originPath === item.treeOrigin);
  if (tree === undefined) {
    return false;
  }

  const parentRole = tree.catalog.roles.find(
    (r) => r.name === parent.imposedRoleName
  );
  if (parentRole?.form !== 'fragments') {
    return false;
  }

  const hasParentViolation = (): boolean => {
    if (parent.domainKind === 'category') {
      const isMimetic = tree.mimeticPathStructures.some((structure) =>
        structure.paths.includes(parent.path)
      );
      if (isMimetic) {
        return false;
      }
      const slashIndex = classification.path.lastIndexOf('/');
      const fileName = classification.path.slice(slashIndex + 1);
      return classification.role.kind !== 'absent' || fileName === 'index.ts';
    }

    const slashIndex = classification.path.lastIndexOf('/');
    const fileName = classification.path.slice(slashIndex + 1);
    const dotIndex = fileName.indexOf('.');
    const stem = dotIndex <= 0 ? fileName : fileName.slice(0, dotIndex);
    const parentSlashIndex = parent.path.lastIndexOf('/');
    const parentName = parent.path.slice(parentSlashIndex + 1);
    if (stem !== parentName) {
      return false;
    }

    if (parent.domainKind === 'sub-category') {
      return classification.role.kind !== 'absent';
    }

    return (
      parent.domainKind === 'fragment' &&
      parent.relationalQualifications.isPathFragment &&
      classification.role.roleName !== parent.imposedRoleName
    );
  };

  return hasParentViolation();
}
