import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TForeignSelection } from './select-foreign-nodes.type.js';

import { assertInvariant } from '../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { collectForeignDomains } from './_utils/collect-foreign-domains/index.js';
import { collectForeignFamilies } from './_utils/collect-foreign-families/index.js';
import { collectIndividualForeignNodes } from './_utils/collect-individual-foreign-nodes/index.js';
import { EMPTY_FOREIGN_SELECTION } from './select-foreign-nodes.constant.js';

export function selectForeignNodes(
  inventory: TInventory,
  tree: TEffectiveTree
): TForeignSelection {
  const originItemId = inventory.pathToId.get(tree.originPath);
  if (originItemId === undefined) {
    return EMPTY_FOREIGN_SELECTION;
  }
  const originItem = inventory.items[originItemId];
  assertInvariant(originItem !== undefined, 'origin id is indexed');
  if (originItem.kind !== 'directory') {
    return EMPTY_FOREIGN_SELECTION;
  }

  const domains = collectForeignDomains(
    inventory,
    inventory.items,
    originItem,
    tree.foreignDomains
  );
  const individuals = collectIndividualForeignNodes(
    inventory,
    originItem,
    tree.foreignNodes.individualPaths
  );
  const families = collectForeignFamilies(
    inventory,
    inventory.items,
    originItem,
    tree.foreignNodes.families
  );

  return {
    foreignDomainItemIds: domains.domainItemIds,
    foreignDomainPaths: domains.domainPaths,
    foreignNodeItemIds: new Set([
      ...domains.nodeItemIds,
      ...individuals.nodeItemIds,
      ...families.nodeItemIds,
    ]),
    foreignNodePaths: new Set([
      ...domains.nodePaths,
      ...individuals.nodePaths,
      ...families.nodePaths,
    ]),
  };
}
