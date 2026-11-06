import type { TSourceLocation } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TModuleExport,
  TModuleImport,
  TModuleRecord,
} from '../../../../../../_session@shared/_types/module-record.type.js';

import { compareSourceLocations } from '../../../../_verify-project@shared/_utils/compare-source-locations/index.js';
import { dedupeSourceLocations } from './_utils/dedupe-source-locations/index.js';
import { hasMatchingDirectReExport } from './_utils/has-matching-direct-re-export/index.js';
import { RE_EXPORT_IMPORT_KINDS } from './collect-re-export-positions.constant.js';

export function collectReExportPositions(
  record: TModuleRecord
): readonly TSourceLocation[] {
  const directReExports: TModuleImport[] = [];
  for (const item of record.imports) {
    if (RE_EXPORT_IMPORT_KINDS.has(item.kind)) {
      directReExports.push(item);
    }
  }
  directReExports.sort((left, right) =>
    compareSourceLocations(left.position, right.position)
  );

  const reExports: TModuleExport[] = [];
  for (const item of record.exports) {
    if (item.origin.type !== 'local-symbol') {
      reExports.push(item);
    }
  }

  if (reExports.length === 0) {
    return [];
  }

  const positions: TSourceLocation[] = [];
  const handledExports = new Set<TModuleExport>();

  for (const direct of directReExports) {
    if (hasMatchingDirectReExport(direct, reExports, handledExports)) {
      positions.push({ column: 1, line: direct.position.line });
    }
  }

  for (const exp of reExports) {
    if (!handledExports.has(exp)) {
      positions.push({ column: 1, line: exp.position.line });
    }
  }

  return dedupeSourceLocations(positions);
}
