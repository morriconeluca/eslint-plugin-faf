import type {
  TItemClassification,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { isViolatingPathFragmentName } from './_utils/is-violating-path-fragment-name/index.js';

export function isViolatingUnitName(
  classification: TItemClassification,
  taxonomy: TTaxonomyModel,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): boolean {
  const item = inventory.items[classification.itemId];
  const tree = trees.find(
    (candidate) => candidate.originPath === item?.treeOrigin
  );
  if (tree === undefined) {
    return false;
  }

  const { domainKind, entryKind, nodeKind, path } = classification;
  const fileName = path.slice(path.lastIndexOf('/') + 1);

  if (entryKind === 'directory') {
    const isPathFragment =
      domainKind === 'fragment' &&
      classification.relationalQualifications.isPathFragment;
    return (
      isPathFragment &&
      isViolatingPathFragmentName(fileName, path, tree.mimeticPathStructures)
    );
  }

  const validNodeKinds = new Set([
    'category-node',
    'fragment-node',
    'master-node',
    'sub-graph-node',
  ]);
  if (!validNodeKinds.has(nodeKind ?? '')) {
    return false;
  }

  const dotIndex = fileName.indexOf('.');
  const stem = dotIndex === -1 ? fileName : fileName.slice(0, dotIndex);
  const parent = taxonomy.byItemId.get(item?.parentId ?? -1);

  return parent?.relationalQualifications.isPathFragment === true
    ? isViolatingPathFragmentName(stem, parent.path, tree.mimeticPathStructures)
    : !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(stem);
}
