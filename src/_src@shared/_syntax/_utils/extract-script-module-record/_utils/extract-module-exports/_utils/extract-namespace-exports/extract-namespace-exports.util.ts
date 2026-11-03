import type { TSGlobalDeclaration, TSModuleDeclaration } from 'oxc-parser';

import type { TModuleExport } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

import { LOCAL_SYMBOL_ORIGIN } from '../../extract-module-exports.constant.js';

export function extractNamespaceExports(
  declaration: TSGlobalDeclaration | TSModuleDeclaration,
  locator: TSourceLocator,
  exports: TModuleExport[],
  seenExportNames: Set<string>
): void {
  if (
    declaration.kind !== 'namespace' ||
    declaration.id.type !== 'Identifier'
  ) {
    return;
  }
  seenExportNames.add(declaration.id.name);
  exports.push({
    exportedName: declaration.id.name,
    isTypeOnly: false,
    origin: { symbolName: declaration.id.name, type: LOCAL_SYMBOL_ORIGIN },
    position: locator(declaration.id.start),
  });
}
