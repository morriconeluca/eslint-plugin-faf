import type { TModuleExport } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TFunctionDeclaration } from './extract-function-exports.type.js';

import {
  DEFAULT_NAME,
  LOCAL_SYMBOL_ORIGIN,
} from '../../../../_extract-module-exports@shared/_constants/module-exports.constant.js';

export function extractFunctionExports(
  declaration: TFunctionDeclaration,
  locator: TSourceLocator,
  exports: TModuleExport[],
  seenExportNames: Set<string>
): void {
  const name = declaration.id?.name ?? DEFAULT_NAME;
  if (seenExportNames.has(name)) {
    return;
  }
  seenExportNames.add(name);
  exports.push({
    exportedName: name,
    isTypeOnly: false,
    origin: { symbolName: name, type: LOCAL_SYMBOL_ORIGIN },
    position: locator(declaration.start),
  });
}
