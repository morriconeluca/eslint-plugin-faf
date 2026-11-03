import type { Statement } from 'oxc-parser';

import type { TModuleExport } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

import { extractClassExports } from '../extract-class-exports/index.js';
import { extractFunctionExports } from '../extract-function-exports/index.js';
import { extractNamespaceExports } from '../extract-namespace-exports/index.js';
import { extractTypeExports } from '../extract-type-exports/index.js';
import { extractVariableExports } from '../extract-variable-exports/index.js';

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
