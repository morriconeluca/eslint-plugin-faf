import type { ExportNamedDeclaration } from 'oxc-parser';

import type { TModuleExport } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { IMPORTED_BINDING_ORIGIN } from '../../../../_extract-module-exports@shared/_constants/module-exports.constant.js';
import { getExportedName } from '../../../../_extract-module-exports@shared/_utils/get-exported-name/index.js';

export function extractReExportSpecifiers(
  statement: ExportNamedDeclaration,
  locator: TSourceLocator,
  exports: TModuleExport[]
): void {
  if (statement.source === null) {
    return;
  }
  const sourceSpecifier = statement.source.value;
  const isDeclarationTypeOnly = statement.exportKind === 'type';
  for (const specifier of statement.specifiers) {
    const exportedName = getExportedName(specifier.exported);
    const importedName = getExportedName(specifier.local);
    const isTypeOnly = isDeclarationTypeOnly || specifier.exportKind === 'type';
    exports.push({
      exportedName,
      isTypeOnly,
      origin: {
        importedName,
        specifier: sourceSpecifier,
        type: IMPORTED_BINDING_ORIGIN,
      },
      position: locator(specifier.start),
    });
  }
}
