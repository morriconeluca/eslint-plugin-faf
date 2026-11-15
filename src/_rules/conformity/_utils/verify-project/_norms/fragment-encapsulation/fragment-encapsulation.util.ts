import type { TDependencyOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TInventory,
  TInventoryItem,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { describeEdgeGeometry } from '../_norms@shared/_utils/describe-edge-geometry/index.js';

const resolveEnclosingFragment = (
  destinationPath: string,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TInventoryItem | undefined => {
  const destinationId = inventory.pathToId.get(destinationPath);
  const destinationClassification =
    destinationId === undefined
      ? undefined
      : taxonomy.byItemId.get(destinationId);
  const isFragmentNode =
    destinationClassification?.nodeKind === 'master-node' ||
    destinationClassification?.nodeKind === 'fragment-node';
  if (!isFragmentNode || destinationId === undefined) {
    return undefined;
  }

  const destinationItem = inventory.items[destinationId];
  const parentItem =
    destinationItem === undefined || destinationItem.parentId === null
      ? undefined
      : inventory.items[destinationItem.parentId];
  return parentItem !== undefined &&
    taxonomy.byItemId.get(parentItem.id)?.domainKind === 'fragment'
    ? parentItem
    : undefined;
};

export function checkEdgeEncapsulation(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel
): TDependencyOutcome | undefined {
  const parentItem = resolveEnclosingFragment(
    edge.destinationPath,
    inventory,
    taxonomy
  );
  if (parentItem === undefined) {
    return undefined;
  }

  const geometry = describeEdgeGeometry(
    edge.sourcePath,
    edge.destinationPath,
    inventory
  );
  if (!geometry.sameTree || geometry.isSourceInside(parentItem)) {
    return undefined;
  }

  return createOutcome.edge('dependency/fragment-encapsulation', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}
