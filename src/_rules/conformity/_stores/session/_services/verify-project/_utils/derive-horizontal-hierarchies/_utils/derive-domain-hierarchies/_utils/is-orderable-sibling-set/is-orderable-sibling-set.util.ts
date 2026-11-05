import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

export function isOrderableSiblingSet(
  parent: TItemClassification | undefined,
  children: readonly (TItemClassification | undefined)[]
): boolean {
  if (
    parent?.domainKind === 'category' ||
    parent?.domainKind === 'sub-category'
  ) {
    return (
      !parent.relationalQualifications.isParentCategory &&
      children.every((child) => child?.domainKind === 'sub-category')
    );
  }
  if (
    parent?.domainKind !== 'layer' &&
    parent?.domainKind !== 'root-layer' &&
    parent?.domainKind !== 'fractal-branch'
  ) {
    return false;
  }
  return (
    children.every((child) => child?.domainKind === 'layer') ||
    children.every((child) => child?.domainKind === 'category')
  );
}
