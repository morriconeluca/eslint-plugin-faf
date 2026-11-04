import type { VariableDeclaration } from 'oxc-parser';

import type { TModuleExport } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TPatternIdentifier } from './_utils/collect-pattern-identifiers/index.js';

import { LOCAL_SYMBOL_ORIGIN } from '../../../../_extract-module-exports@shared/_constants/module-exports.constant.js';
import { collectPatternIdentifiers } from './_utils/collect-pattern-identifiers/index.js';

export function extractVariableExports(
  declaration: VariableDeclaration,
  locator: TSourceLocator,
  exports: TModuleExport[],
  seenExportNames: Set<string>
): void {
  const identifiers: TPatternIdentifier[] = [];
  for (const declarator of declaration.declarations) {
    collectPatternIdentifiers(declarator.id, identifiers);
  }
  for (const item of identifiers) {
    seenExportNames.add(item.name);
    exports.push({
      exportedName: item.name,
      isTypeOnly: false,
      origin: { symbolName: item.name, type: LOCAL_SYMBOL_ORIGIN },
      position: locator(item.start),
    });
  }
}
