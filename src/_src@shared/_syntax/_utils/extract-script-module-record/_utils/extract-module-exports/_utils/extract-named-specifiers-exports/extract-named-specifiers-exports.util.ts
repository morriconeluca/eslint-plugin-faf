import type { ExportNamedDeclaration } from 'oxc-parser';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../_types/module-record.type.js';
import type {
  TImportedBinding,
  TSourceLocator,
} from '../../../../extract-script-module-record.type.js';

import { extractLocalSpecifiers } from '../extract-local-specifiers/index.js';
import { extractReExportSpecifiers } from '../extract-re-export-specifiers/index.js';

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
