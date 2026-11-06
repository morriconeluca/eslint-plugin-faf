import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TExternalCrossing } from '../../../../_verify-project@shared/_types/_compounds/external-crossing.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function checkCrossingTreeAuthorization(
  crossing: TExternalCrossing,
  inventory: TInventory,
  authorizedTreePairs: ReadonlySet<string>
): TDependencyOutcome | undefined {
  const sourceItemId = inventory.pathToId.get(crossing.sourcePath);
  const sourceItem =
    sourceItemId === undefined ? undefined : inventory.items[sourceItemId];
  if (sourceItem === undefined || sourceItem.treeOrigin === null) {
    return undefined;
  }
  const sourceTreeOrigin = sourceItem.treeOrigin;

  const destinationItemId = inventory.pathToId.get(crossing.destinationPath);
  const destinationItem =
    destinationItemId === undefined
      ? undefined
      : inventory.items[destinationItemId];
  if (destinationItem === undefined || destinationItem.treeOrigin === null) {
    return undefined;
  }
  const destinationTreeOrigin = destinationItem.treeOrigin;

  if (sourceTreeOrigin === destinationTreeOrigin) {
    return undefined;
  }

  const authorizationKey = `${sourceTreeOrigin}\0${destinationTreeOrigin}`;
  if (authorizedTreePairs.has(authorizationKey)) {
    return undefined;
  }

  return createOutcome('dependency/tree-authorization', {
    chain: crossing.chain,
    from: crossing.sourcePath,
    importIndex: crossing.importIndex,
    position: crossing.position,
    specifier: crossing.specifier,
    to: crossing.destinationPath,
  });
}
