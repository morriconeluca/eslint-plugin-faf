import type { Statement } from 'oxc-parser';

import type { TModuleExport } from '../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { extractClassExports } from './_utils/extract-class-exports/index.js';
import { extractFunctionExports } from './_utils/extract-function-exports/index.js';
import { extractNamespaceExports } from './_utils/extract-namespace-exports/index.js';
import { extractTypeExports } from './_utils/extract-type-exports/index.js';
import { extractVariableExports } from './_utils/extract-variable-exports/index.js';

export function extractDeclarationExports(
  declaration: Statement,
  locator: TSourceLocator,
  exports: TModuleExport[],
  seenExportNames: Set<string>
): void {
  if (declaration.type === 'VariableDeclaration') {
    extractVariableExports(declaration, locator, exports, seenExportNames);
    return;
  }

  if (
    declaration.type === 'TSInterfaceDeclaration' ||
    declaration.type === 'TSTypeAliasDeclaration'
  ) {
    extractTypeExports(declaration, locator, exports, seenExportNames);
    return;
  }

  if (
    declaration.type === 'FunctionDeclaration' ||
    declaration.type === 'TSDeclareFunction'
  ) {
    extractFunctionExports(declaration, locator, exports, seenExportNames);
    return;
  }

  if (
    declaration.type === 'ClassDeclaration' ||
    declaration.type === 'TSEnumDeclaration'
  ) {
    extractClassExports(declaration, locator, exports, seenExportNames);
    return;
  }

  if (declaration.type === 'TSModuleDeclaration') {
    extractNamespaceExports(declaration, locator, exports, seenExportNames);
  }
}
