import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function isViolatingDomainName(
  classification: TItemClassification,
  inventory: TInventory,
  trees: readonly TEffectiveTree[]
): boolean {
  if (
    classification.entryKind !== 'directory' ||
    classification.domainKind === null ||
    classification.relationalQualifications.isPathFragment
  ) {
    return false;
  }

  const item = inventory.items[classification.itemId];
  const isOrigin = trees.some((tree) => tree.originPath === item?.path);
  if (item === undefined || isOrigin) {
    return false;
  }

  const directoryName = classification.path.slice(
    classification.path.lastIndexOf('/') + 1
  );

  const { domainKind } = classification;
  if (domainKind === 'fractal-branch') {
    const parentPath = inventory.items[item.parentId ?? -1]?.path;
    const scope = parentPath
      ?.slice(parentPath.lastIndexOf('/') + 1)
      .replace(/^_/u, '');
    return directoryName !== `_${scope}@shared`;
  }

  const allowedKinds = new Set([
    'category',
    'fragment',
    'layer',
    'sub-category',
  ]);
  if (!allowedKinds.has(domainKind)) {
    return false;
  }

  const isFragment = domainKind === 'fragment';
  const hasMatchingPrefix = isFragment !== directoryName.startsWith('_');
  const checkedSegment = directoryName.slice(Number(!isFragment));
  return (
    !hasMatchingPrefix || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(checkedSegment)
  );
}
