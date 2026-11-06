import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

export function isPermittedEdge(
  sourceItem: TInventoryItem | undefined,
  destinationItem: TInventoryItem | undefined,
  destinationClassification: TItemClassification | undefined
): boolean {
  if (
    sourceItem === undefined ||
    destinationItem === undefined ||
    destinationClassification === undefined
  ) {
    return false;
  }

  const isDirectSibling =
    sourceItem.parentId !== null &&
    sourceItem.parentId === destinationItem.parentId;

  const isFragmentNode =
    destinationClassification.nodeKind === 'master-node' ||
    destinationClassification.nodeKind === 'fragment-node';

  return isDirectSibling && isFragmentNode;
}
