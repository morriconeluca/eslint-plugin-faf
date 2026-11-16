import type {
  TSourceLocation,
  TSymbolOutcome,
} from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TModuleExport,
  TModuleImport,
  TModuleRecord,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../_conformity@shared/_utils/compare-source-locations/index.js';
import { RE_EXPORT_IMPORT_KINDS } from './re-export-prohibition.constant.js';

const dedupeSourceLocations = (
  locations: readonly TSourceLocation[]
): readonly TSourceLocation[] => {
  const sorted = [...locations];
  sorted.sort(compareSourceLocations);
  const deduped: TSourceLocation[] = [];

  for (const position of sorted) {
    const last = deduped.at(-1);
    if (last === undefined || compareSourceLocations(last, position) !== 0) {
      deduped.push(position);
    }
  }

  return deduped;
};

const hasMatchingDirectReExport = (
  directReExport: TModuleImport,
  reExports: readonly TModuleExport[],
  handledExports: Set<TModuleExport>
): boolean => {
  let hasMatch = false;

  for (const moduleExport of reExports) {
    const isEligible =
      !handledExports.has(moduleExport) &&
      'specifier' in moduleExport.origin &&
      moduleExport.origin.specifier === directReExport.specifier &&
      compareSourceLocations(directReExport.position, moduleExport.position) <=
        0;

    if (!isEligible) {
      continue;
    }

    handledExports.add(moduleExport);
    hasMatch = true;
  }

  return hasMatch;
};

export function collectReExportPositions(
  record: TModuleRecord
): readonly TSourceLocation[] {
  const directReExports: TModuleImport[] = [];
  for (const moduleImport of record.imports) {
    if (RE_EXPORT_IMPORT_KINDS.has(moduleImport.kind)) {
      directReExports.push(moduleImport);
    }
  }
  directReExports.sort((left, right) =>
    compareSourceLocations(left.position, right.position)
  );

  const reExports: TModuleExport[] = [];
  for (const moduleExport of record.exports) {
    if (moduleExport.origin.type !== 'local-symbol') {
      reExports.push(moduleExport);
    }
  }

  if (reExports.length === 0) {
    return [];
  }

  const positions: TSourceLocation[] = [];
  const handledExports = new Set<TModuleExport>();

  for (const directReExport of directReExports) {
    if (hasMatchingDirectReExport(directReExport, reExports, handledExports)) {
      positions.push({ column: 1, line: directReExport.position.line });
    }
  }

  for (const moduleExport of reExports) {
    if (!handledExports.has(moduleExport)) {
      positions.push({ column: 1, line: moduleExport.position.line });
    }
  }

  return dedupeSourceLocations(positions);
}

export function compareSymbolOutcomes(
  left: TSymbolOutcome,
  right: TSymbolOutcome
): number {
  const elementComparison = compareOrdinal(left.element, right.element);
  if (elementComparison !== 0) {
    return elementComparison;
  }
  const positionComparison = compareSourceLocations(
    left.position ?? { column: 0, line: 0 },
    right.position ?? { column: 0, line: 0 }
  );
  return positionComparison === 0
    ? compareOrdinal(left.message, right.message)
    : positionComparison;
}
