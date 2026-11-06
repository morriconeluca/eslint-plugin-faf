import type { TDependencyOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TEffectivePathAlias } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function checkEdgeAliasAnchoring(
  edge: TEdgeMetadata,
  inventory: TInventory,
  taxonomy: TTaxonomyModel,
  aliases: readonly TEffectivePathAlias[]
): TDependencyOutcome | undefined {
  if (edge.aliasUsed === null) {
    return undefined;
  }

  const sourceId = inventory.pathToId.get(edge.sourcePath);
  const destinationId = inventory.pathToId.get(edge.destinationPath);
  const sourceItem =
    sourceId === undefined ? undefined : inventory.items[sourceId];
  const destinationItem =
    destinationId === undefined ? undefined : inventory.items[destinationId];

  const sourceOrigin = sourceItem?.treeOrigin ?? null;
  if (sourceOrigin === null || sourceOrigin !== destinationItem?.treeOrigin) {
    return undefined;
  }

  const matchedAlias = aliases.find((alias) => alias.prefix === edge.aliasUsed);
  const baseAlternatives = matchedAlias?.targets ?? edge.aliasAlternatives;

  const isAnchored =
    baseAlternatives.length > 0 &&
    baseAlternatives.every((basePath) => {
      const baseId = inventory.pathToId.get(basePath);
      if (baseId === undefined) {
        return false;
      }
      const baseItem = inventory.items[baseId];
      if (baseItem === undefined || baseItem.treeOrigin !== sourceOrigin) {
        return false;
      }
      const classification =
        taxonomy.byItemId.get(baseId) ?? taxonomy.byPath.get(basePath);
      return (
        classification !== undefined &&
        classification.domainKind === 'fractal-branch'
      );
    });

  if (!isAnchored) {
    return createOutcome('dependency/path-alias-anchoring', {
      from: edge.sourcePath,
      importIndex: edge.importIndex,
      position: edge.position,
      specifier: edge.specifier,
      to: edge.destinationPath,
    });
  }

  return undefined;
}
