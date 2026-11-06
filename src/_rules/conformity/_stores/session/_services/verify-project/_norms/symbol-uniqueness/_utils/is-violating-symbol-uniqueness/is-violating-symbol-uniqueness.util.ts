import type { TModuleRecord } from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

export function isViolatingSymbolUniqueness(
  classification: TItemClassification,
  record: TModuleRecord,
  tree: TEffectiveTree
): boolean {
  const roleName = classification.role.roleName;
  if (roleName === null || classification.role.kind !== 'explicit') {
    return false;
  }

  const { nodeKind } = classification;
  const isTargetKind =
    nodeKind === 'category-node' ||
    nodeKind === 'fragment-node' ||
    nodeKind === 'unauthorized-logical-node';

  if (
    !isTargetKind ||
    tree.catalog.subGraphRoles.includes(roleName) ||
    record.symbols.length <= 1
  ) {
    return false;
  }

  const role = tree.catalog.roles.find(
    (candidate) => candidate.name === roleName
  );

  return role?.allowMultipleSymbols !== true;
}
