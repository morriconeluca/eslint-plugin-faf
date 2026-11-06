import type { TModuleRecord } from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TItemClassification } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';

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
    (exp) =>
      exp.origin.type !== 'local-symbol' ||
      exp.origin.symbolName !== masterSymbolName
  );
}
