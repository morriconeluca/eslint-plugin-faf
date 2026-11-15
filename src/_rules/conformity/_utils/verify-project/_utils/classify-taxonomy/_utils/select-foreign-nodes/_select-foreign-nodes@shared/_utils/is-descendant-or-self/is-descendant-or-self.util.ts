import type { TInventoryItem } from '../../../../../../../_verify-project@shared/_types/verification-model.type.js';

export function isDescendantOrSelf(
  candidate: TInventoryItem,
  ancestor: TInventoryItem
): boolean {
  return (
    ancestor.preorderStart <= candidate.preorderStart &&
    candidate.preorderEnd <= ancestor.preorderEnd
  );
}
