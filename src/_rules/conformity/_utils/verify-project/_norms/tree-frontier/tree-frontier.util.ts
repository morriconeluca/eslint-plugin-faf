import type {
  TDependencyOutcome,
  TSourceLocation,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TExternalCrossing,
  TInventory,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../_verify-project@shared/_utils/compare-source-locations/index.js';

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

  return createOutcome.path('dependency/tree-authorization', {
    chain: crossing.chain,
    from: crossing.sourcePath,
    importIndex: crossing.importIndex,
    position: crossing.position,
    specifier: crossing.specifier,
    to: crossing.destinationPath,
  });
}

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
      createOutcome.edge('dependency/tree-opacity', {
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
        createOutcome.edge('dependency/tree-authorization', {
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

export function compareTreeFrontierOutcomes(
  left: TDependencyOutcome,
  right: TDependencyOutcome
): number {
  const absentLocation: TSourceLocation = { column: 0, line: 0 };
  const comparisons = [
    compareOrdinal(left.from, right.from),
    compareSourceLocations(
      left.position ?? absentLocation,
      right.position ?? absentLocation
    ),
    left.importIndex - right.importIndex,
    compareOrdinal(left.to, right.to),
    compareOrdinal(left.specifier ?? '', right.specifier ?? ''),
    compareOrdinal(left.constraint, right.constraint),
    compareOrdinal(
      (left.chain ?? []).join('\0'),
      (right.chain ?? []).join('\0')
    ),
    compareOrdinal(left.message, right.message),
  ];

  for (const diff of comparisons) {
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}
