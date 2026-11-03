import type { Class, TSEnumDeclaration } from 'oxc-parser';

import type { TModuleExport } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

import {
  DEFAULT_NAME,
  LOCAL_SYMBOL_ORIGIN,
} from '../../extract-module-exports.constant.js';

export function extractClassExports(
  declaration: Class | TSEnumDeclaration,
  locator: TSourceLocator,
  exports: TModuleExport[],
  seenExportNames: Set<string>
): void {
  const name = declaration.id?.name ?? DEFAULT_NAME;
  seenExportNames.add(name);
  exports.push({
    exportedName: name,
    isTypeOnly: false,
    origin: { symbolName: name, type: LOCAL_SYMBOL_ORIGIN },
    position: locator(declaration.start),
  });
}
