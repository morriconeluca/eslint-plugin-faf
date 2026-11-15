import type {
  TEdgeMetadata,
  TInventoryItem,
  TVerificationModel,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';

import { isAuthorizedRootDependency } from './_utils/is-authorized-root-dependency/index.js';
import { isStrictlyDescendingRoot } from './_utils/is-strictly-descending-root/index.js';

export function isRootEdgeAuthorized(
  sourceItem: TInventoryItem,
  destinationItem: TInventoryItem,
  edge: TEdgeMetadata,
  model: TVerificationModel
): boolean {
  if (edge.aliasUsed !== null) {
    return false;
  }

  const sourceParentId = sourceItem.parentId;
  const sourceParentItem =
    sourceParentId === null
      ? undefined
      : model.basis.inventory.items[sourceParentId];
  const destinationParentId = destinationItem.parentId;

  if (sourceParentItem === undefined || destinationParentId === null) {
    return false;
  }

  const sourceTree = sourceItem.treeOrigin ?? '';

  return sourceParentId === destinationParentId
    ? isStrictlyDescendingRoot(
        sourceItem.id,
        destinationItem.id,
        sourceParentItem.path,
        model.hierarchies
      )
    : isAuthorizedRootDependency(
        edge.sourcePath,
        edge.destinationPath,
        sourceParentItem.path,
        sourceTree,
        model.basis.declarations
      );
}
