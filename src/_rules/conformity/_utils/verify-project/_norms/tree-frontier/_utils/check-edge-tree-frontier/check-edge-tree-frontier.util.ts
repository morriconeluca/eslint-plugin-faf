import type { TDependencyOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TInventory,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';

export function checkEdgeTreeFrontier(
  edge: TEdgeMetadata,
  inventory: TInventory,
  publicNodes: ReadonlySet<string>,
  authorizedTreePairs: ReadonlySet<string>
): readonly TDependencyOutcome[] {
  const destinationItemId = inventory.pathToId.get(edge.destinationPath);
  if (destinationItemId === undefined) {
    return [];
  }
  const destinationItem = inventory.items[destinationItemId];
  if (destinationItem === undefined || destinationItem.treeOrigin === null) {
    return [];
  }
  const destinationTreeOrigin = destinationItem.treeOrigin;

  const sourceItemId = inventory.pathToId.get(edge.sourcePath);
  const sourceItem =
    sourceItemId === undefined ? undefined : inventory.items[sourceItemId];
  const sourceTreeOrigin = sourceItem?.treeOrigin ?? null;

  if (sourceTreeOrigin === destinationTreeOrigin) {
    return [];
  }

  const outcomes: TDependencyOutcome[] = [];

  if (!publicNodes.has(edge.destinationPath)) {
    outcomes.push(
      createOutcome('dependency/tree-opacity', {
        from: edge.sourcePath,
        importIndex: edge.importIndex,
        position: edge.position,
        specifier: edge.specifier,
        to: edge.destinationPath,
      })
    );
  }

  if (sourceTreeOrigin !== null) {
    const authorizationKey = `${sourceTreeOrigin}\0${destinationTreeOrigin}`;
    if (!authorizedTreePairs.has(authorizationKey)) {
      outcomes.push(
        createOutcome('dependency/tree-authorization', {
          from: edge.sourcePath,
          importIndex: edge.importIndex,
          position: edge.position,
          specifier: edge.specifier,
          to: edge.destinationPath,
        })
      );
    }
  }

  return outcomes;
}
