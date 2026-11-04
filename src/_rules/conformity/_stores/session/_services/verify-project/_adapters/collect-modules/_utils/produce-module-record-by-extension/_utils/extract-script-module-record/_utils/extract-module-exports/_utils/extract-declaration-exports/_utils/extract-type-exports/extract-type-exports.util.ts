import type {
  TSInterfaceDeclaration,
  TSTypeAliasDeclaration,
} from 'oxc-parser';

import type { TModuleExport } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { LOCAL_SYMBOL_ORIGIN } from '../../../../_extract-module-exports@shared/_constants/module-exports.constant.js';

export function extractTypeExports(
  declaration: TSInterfaceDeclaration | TSTypeAliasDeclaration,
  locator: TSourceLocator,
  exports: TModuleExport[],
  seenExportNames: Set<string>
): void {
  seenExportNames.add(declaration.id.name);
  exports.push({
    exportedName: declaration.id.name,
    isTypeOnly: true,
    origin: { symbolName: declaration.id.name, type: LOCAL_SYMBOL_ORIGIN },
    position: locator(declaration.id.start),
  });
}
