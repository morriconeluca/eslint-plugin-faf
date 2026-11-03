import type { ExportNamedDeclaration } from 'oxc-parser';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../_types/module-record.type.js';
import type { TImportedBinding } from '../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { extractLocalSpecifiers } from './_utils/extract-local-specifiers/index.js';
import { extractReExportSpecifiers } from './_utils/extract-re-export-specifiers/index.js';

export function extractNamedSpecifiersExports(
  statement: ExportNamedDeclaration,
  rootSymbols: readonly TRootSymbol[],
  importedBindings: ReadonlyMap<string, TImportedBinding>,
  locator: TSourceLocator,
  exports: TModuleExport[]
): void {
  if (statement.source !== null) {
    extractReExportSpecifiers(statement, locator, exports);
    return;
  }

  extractLocalSpecifiers(
    statement,
    rootSymbols,
    importedBindings,
    locator,
    exports
  );
}
