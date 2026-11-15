import type {
  TEffectiveRole,
  TEffectiveTree,
  TInventory,
  TItemClassification,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

type TParentRoleContext = {
  readonly parent: TItemClassification;
  readonly parentRole: TEffectiveRole;
  readonly tree: TEffectiveTree;
};

const resolveParentRoleContext = (
  classification: TItemClassification,
  taxonomy: TTaxonomyModel,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): TParentRoleContext | undefined => {
  const item = inventory.items[classification.itemId];
  if (
    item === undefined ||
    typeof item.parentId !== 'number' ||
    item.treeOrigin === null
  ) {
    return undefined;
  }
  const parent = taxonomy.byItemId.get(item.parentId);
  if (typeof parent?.imposedRoleName !== 'string') {
    return undefined;
  }
  const tree = trees.find(
    (candidateTree) => candidateTree.originPath === item.treeOrigin
  );
  if (tree === undefined) {
    return undefined;
  }
  const parentRole = tree.catalog.roles.find(
    (role) => role.name === parent.imposedRoleName
  );
  return parentRole === undefined ? undefined : { parent, parentRole, tree };
};

const isEligibleLogicalFile = (classification: TItemClassification): boolean =>
  classification.entryKind === 'file' &&
  classification.nodeKind !== null &&
  classification.nodeKind !== 'foreign-node';

export function isViolatingCategoryNodesForm(
  classification: TItemClassification,
  taxonomy: TTaxonomyModel,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): boolean {
  if (!isEligibleLogicalFile(classification)) {
    return false;
  }
  if (classification.role.kind === 'implicit') {
    return classification.nodeKind !== 'category-node';
  }

  const context = resolveParentRoleContext(
    classification,
    taxonomy,
    inventory,
    trees
  );
  if (context === undefined) {
    return false;
  }

  const { domainKind } = context.parent;
  const isContainer =
    domainKind === 'category' || domainKind === 'sub-category';

  return (
    isContainer &&
    context.parentRole.form === 'category-nodes' &&
    classification.nodeKind !== 'category-node'
  );
}

export function isViolatingFragmentsForm(
  classification: TItemClassification,
  taxonomy: TTaxonomyModel,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): boolean {
  if (!isEligibleLogicalFile(classification)) {
    return false;
  }

  const context = resolveParentRoleContext(
    classification,
    taxonomy,
    inventory,
    trees
  );
  if (context?.parentRole.form !== 'fragments') {
    return false;
  }

  const { parent, tree } = context;
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

  return (
    parent.domainKind === 'sub-category' &&
    classification.role.kind !== 'absent'
  );
}
