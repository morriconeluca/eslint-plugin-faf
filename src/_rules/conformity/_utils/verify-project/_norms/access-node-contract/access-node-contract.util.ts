import type {
  TDependencyOutcome,
  TOutcome,
  TSymbolOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
  TInventoryItem,
  TItemClassification,
  TModuleExport,
  TModuleRecord,
  TVerificationModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../_verify-project@shared/_utils/compare-source-locations/index.js';

const ACCESS_NODE = 'access-node';

const isPermittedEdge = (
  sourceItem: TInventoryItem | undefined,
  destinationItem: TInventoryItem | undefined,
  destinationClassification: TItemClassification | undefined
): boolean => {
  if (
    sourceItem === undefined ||
    destinationItem === undefined ||
    destinationClassification === undefined
  ) {
    return false;
  }

  const isDirectSibling =
    sourceItem.parentId !== null &&
    sourceItem.parentId === destinationItem.parentId;

  const isFragmentNode =
    destinationClassification.nodeKind === 'master-node' ||
    destinationClassification.nodeKind === 'fragment-node';

  return isDirectSibling && isFragmentNode;
};

export function collectSourceOutcomes(
  model: TVerificationModel
): readonly TDependencyOutcome[] {
  const outcomes: TDependencyOutcome[] = [];
  const { inventory } = model.basis;
  const { graph, taxonomy } = model;

  for (const edge of graph.edgeMetadata) {
    const sourceClassification = taxonomy.byPath.get(edge.sourcePath);
    if (sourceClassification?.nodeKind !== ACCESS_NODE) {
      continue;
    }

    const sourceItem = inventory.items[sourceClassification.itemId];
    const destinationClassification = taxonomy.byPath.get(edge.destinationPath);
    const destinationItem =
      destinationClassification === undefined
        ? undefined
        : inventory.items[destinationClassification.itemId];

    if (
      !isPermittedEdge(sourceItem, destinationItem, destinationClassification)
    ) {
      outcomes.push(
        createOutcome('dependency/access-node-sources', {
          from: edge.sourcePath,
          importIndex: edge.importIndex,
          position: edge.position,
          specifier: edge.specifier,
          to: edge.destinationPath,
        })
      );
    }
  }

  for (const libraryImport of graph.libraryImports) {
    const sourceClassification = taxonomy.byPath.get(libraryImport.sourcePath);
    if (sourceClassification?.nodeKind === ACCESS_NODE) {
      outcomes.push(
        createOutcome('dependency/access-node-sources', {
          from: libraryImport.sourcePath,
          importIndex: libraryImport.importIndex,
          position: libraryImport.position,
          specifier: libraryImport.specifier,
          to: libraryImport.packageName,
        })
      );
    }
  }

  return outcomes;
}

const indexMastersByParent = (
  classifications: readonly TItemClassification[],
  items: readonly TInventoryItem[]
): ReadonlyMap<number, TItemClassification> => {
  const masterMap = new Map<number, TItemClassification>();

  for (const classification of classifications) {
    if (classification.nodeKind !== 'master-node') {
      continue;
    }
    const inventoryItem = items[classification.itemId];
    if (
      inventoryItem?.parentId !== null &&
      inventoryItem?.parentId !== undefined
    ) {
      masterMap.set(inventoryItem.parentId, classification);
    }
  }

  return masterMap;
};

const isMasterReExported = (
  accessExports: readonly TModuleExport[],
  masterPath: string,
  masterRecord: TModuleRecord,
  accessEdges: readonly TEdgeMetadata[]
): boolean => {
  const [masterSymbol] = masterRecord.symbols;
  if (masterSymbol === undefined || masterRecord.symbols.length !== 1) {
    return true;
  }

  const masterSymbolExports = masterRecord.exports.filter(
    (moduleExport) =>
      moduleExport.origin.type === 'local-symbol' &&
      moduleExport.origin.symbolName === masterSymbol.name
  );
  if (masterSymbolExports.length === 0) {
    return true;
  }

  const exportedFromMasterNames = new Set(
    masterSymbolExports.map((moduleExport) => moduleExport.exportedName)
  );
  const hasNamedMasterExport = [...exportedFromMasterNames].some(
    (name) => name !== 'default'
  );
  const isMasterValue = masterSymbol.space === 'value';

  const localDestinationsBySpecifier = new Map<string, string>();
  for (const edge of accessEdges) {
    localDestinationsBySpecifier.set(edge.specifier, edge.destinationPath);
  }

  return accessExports.some((moduleExport) => {
    if (moduleExport.origin.type === 'export-all') {
      const destination = localDestinationsBySpecifier.get(
        moduleExport.origin.specifier
      );
      return (
        destination === masterPath &&
        hasNamedMasterExport &&
        (!isMasterValue || !moduleExport.isTypeOnly)
      );
    }

    if (moduleExport.origin.type === 'imported-binding') {
      const destination = localDestinationsBySpecifier.get(
        moduleExport.origin.specifier
      );
      return (
        destination === masterPath &&
        exportedFromMasterNames.has(moduleExport.origin.importedName) &&
        (!isMasterValue || !moduleExport.isTypeOnly)
      );
    }

    return false;
  });
};

const checkMasterExport = (
  accessClassification: TItemClassification,
  accessRecord: TModuleRecord,
  masterClassification: TItemClassification | undefined,
  masterRecord: TModuleRecord | undefined,
  graph: TDependencyGraph
): TSymbolOutcome | undefined => {
  if (
    masterClassification === undefined ||
    masterRecord?.language !== 'script'
  ) {
    return undefined;
  }

  const edgeIndices =
    graph.edgesBySourcePath.get(accessClassification.path) ?? [];
  const accessEdges = edgeIndices
    .map((index) => graph.edgeMetadata[index])
    .filter((edge): edge is TEdgeMetadata => edge !== undefined);

  const isReExported = isMasterReExported(
    accessRecord.exports,
    masterClassification.path,
    masterRecord,
    accessEdges
  );

  return isReExported
    ? undefined
    : createOutcome('symbol/access-node-master-export', {
        element: accessClassification.path,
      });
};

export function collectSymbolOutcomes(
  model: TVerificationModel
): readonly TSymbolOutcome[] {
  const outcomes: TSymbolOutcome[] = [];
  const { inventory } = model.basis;
  const { graph, modules, taxonomy } = model;
  const mastersByParentId = indexMastersByParent(
    taxonomy.classifications,
    inventory.items
  );

  const accessClassifications = taxonomy.classifications.filter(
    (classification) => classification.nodeKind === ACCESS_NODE
  );

  for (const classification of accessClassifications) {
    const accessItem = inventory.items[classification.itemId];
    const accessRecord = modules.records.get(classification.path);
    const hasValidScript =
      accessItem?.parentId !== null &&
      accessItem?.parentId !== undefined &&
      accessRecord?.language === 'script';

    if (!hasValidScript) {
      continue;
    }

    if (accessRecord.symbols.length > 0) {
      outcomes.push(
        createOutcome('symbol/access-node-own-symbols', {
          element: classification.path,
        })
      );
    }

    const masterClassification = mastersByParentId.get(accessItem.parentId);
    const masterRecord =
      masterClassification === undefined
        ? undefined
        : modules.records.get(masterClassification.path);

    const masterOutcome = checkMasterExport(
      classification,
      accessRecord,
      masterClassification,
      masterRecord,
      graph
    );
    if (masterOutcome !== undefined) {
      outcomes.push(masterOutcome);
    }
  }

  return outcomes;
}

export function compareAccessNodeOutcomes(
  left: TOutcome,
  right: TOutcome
): number {
  const elementComparison = compareOrdinal(left.element, right.element);
  if (elementComparison !== 0) {
    return elementComparison;
  }

  const constraintComparison = compareOrdinal(
    left.constraint,
    right.constraint
  );
  if (constraintComparison !== 0) {
    return constraintComparison;
  }

  const positionComparison = compareSourceLocations(
    left.position ?? { column: 0, line: 0 },
    right.position ?? { column: 0, line: 0 }
  );
  return positionComparison === 0
    ? compareOrdinal(left.message, right.message)
    : positionComparison;
}
