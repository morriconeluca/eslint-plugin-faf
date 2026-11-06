import type {
  TModuleExport,
  TModuleRecord,
} from '../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TEdgeMetadata } from '../../../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

export function isMasterReExported(
  accessExports: readonly TModuleExport[],
  masterPath: string,
  masterRecord: TModuleRecord,
  accessEdges: readonly TEdgeMetadata[]
): boolean {
  if (masterRecord.symbols.length !== 1) {
    return true;
  }
  const masterSymbol = masterRecord.symbols[0];
  if (masterSymbol === undefined) {
    return true;
  }

  const masterSymbolExports = masterRecord.exports.filter(
    (exp) =>
      exp.origin.type === 'local-symbol' &&
      exp.origin.symbolName === masterSymbol.name
  );
  if (masterSymbolExports.length === 0) {
    return true;
  }

  const exportedFromMasterNames = new Set(
    masterSymbolExports.map((exp) => exp.exportedName)
  );
  const hasNamedMasterExport = [...exportedFromMasterNames].some(
    (name) => name !== 'default'
  );
  const isMasterValue = masterSymbol.space === 'value';

  const localDestinationsBySpecifier = new Map<string, string>();
  for (const edge of accessEdges) {
    localDestinationsBySpecifier.set(edge.specifier, edge.destinationPath);
  }

  return accessExports.some((exp) => {
    if (exp.origin.type === 'export-all') {
      const destination = localDestinationsBySpecifier.get(
        exp.origin.specifier
      );
      return (
        destination === masterPath &&
        hasNamedMasterExport &&
        (!isMasterValue || !exp.isTypeOnly)
      );
    }

    if (exp.origin.type === 'imported-binding') {
      const destination = localDestinationsBySpecifier.get(
        exp.origin.specifier
      );
      return (
        destination === masterPath &&
        exportedFromMasterNames.has(exp.origin.importedName) &&
        (!isMasterValue || !exp.isTypeOnly)
      );
    }

    return false;
  });
}
