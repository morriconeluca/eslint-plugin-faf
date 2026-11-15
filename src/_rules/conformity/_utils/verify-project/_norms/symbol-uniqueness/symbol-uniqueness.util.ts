import type {
  TEffectiveTree,
  TItemClassification,
  TModuleRecord,
} from '../../_verify-project@shared/_types/verification-model.type.js';

const TARGET_NODE_KINDS = new Set([
  'category-node',
  'fragment-node',
  'unauthorized-logical-node',
]);

export function isViolatingMasterSymbol(
  classification: TItemClassification,
  record: TModuleRecord
): boolean {
  const { entryKind, nodeKind } = classification;
  if (entryKind !== 'file' || nodeKind !== 'master-node') {
    return false;
  }

  if (record.symbols.length !== 1) {
    return true;
  }

  const masterSymbolName = record.symbols[0]?.name;

  return record.exports.every(
    (moduleExport) =>
      moduleExport.origin.type !== 'local-symbol' ||
      moduleExport.origin.symbolName !== masterSymbolName
  );
}

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
  if (
    nodeKind === null ||
    !TARGET_NODE_KINDS.has(nodeKind) ||
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
