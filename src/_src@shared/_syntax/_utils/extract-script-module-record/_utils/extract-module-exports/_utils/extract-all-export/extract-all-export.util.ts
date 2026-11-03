import type { ExportAllDeclaration } from 'oxc-parser';

import type { TModuleExport } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

import { NAMESPACE_ORIGIN } from '../../extract-module-exports.constant.js';
import { getExportedName } from '../get-exported-name/index.js';

export function extractAllExport(
  statement: ExportAllDeclaration,
  locator: TSourceLocator
): TModuleExport {
  const isTypeOnly = statement.exportKind === 'type';
  const position = locator(statement.start);
  const specifier = statement.source.value;

  if (statement.exported !== null) {
    const exportedName = getExportedName(statement.exported);
    return {
      exportedName,
      isTypeOnly,
      origin: { specifier, type: NAMESPACE_ORIGIN },
      position,
    };
  }

  return {
    exportedName: '*',
    isTypeOnly,
    origin: { specifier, type: 'export-all' },
    position,
  };
}
