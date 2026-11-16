import type { TInventoryItem } from '../../../../../../../_conformity@shared/_types/verification-model.type.js';

export function isDescendantOrSelf(
  candidate: TInventoryItem,
  ancestor: TInventoryItem
): boolean {
  return (
    ancestor.preorderStart <= candidate.preorderStart &&
    candidate.preorderEnd <= ancestor.preorderEnd
  );
}
