import type { ExportAllDeclaration } from 'oxc-parser';

import type { TModuleExport } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { NAMESPACE_ORIGIN } from '../../_extract-module-exports@shared/_constants/module-exports.constant.js';
import { getExportedName } from '../../_extract-module-exports@shared/_utils/get-exported-name/index.js';

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
