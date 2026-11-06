import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';

export function isViolatingCoordinateName(
  classification: TItemClassification
): boolean {
  if (classification.domainKind !== 'path-sub-category') {
    return false;
  }
  const name = classification.path.slice(
    classification.path.lastIndexOf('/') + 1
  );
  if (name.startsWith('_[') && name.endsWith(']')) {
    return !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name.slice(2, -1));
  }
  const isStatic = name.startsWith('_') && !name.startsWith('_[');
  return !isStatic || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name.slice(1));
}
