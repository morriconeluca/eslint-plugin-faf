import type { TInventoryItem } from '../../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function isDescendantOrSelf(
  candidate: TInventoryItem,
  ancestor: TInventoryItem
): boolean {
  return (
    ancestor.preorderStart <= candidate.preorderStart &&
    candidate.preorderEnd <= ancestor.preorderEnd
  );
}
