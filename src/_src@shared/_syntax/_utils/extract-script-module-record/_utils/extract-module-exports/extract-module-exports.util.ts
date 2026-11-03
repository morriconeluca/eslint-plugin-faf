import type { Statement } from 'oxc-parser';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../_types/module-record.type.js';
import type {
  TImportedBinding,
  TSourceLocator,
} from '../../extract-script-module-record.type.js';

import { extractAllExport } from './_utils/extract-all-export/index.js';
import { extractDeclarationExports } from './_utils/extract-declaration-exports/index.js';
import { extractDefaultExport } from './_utils/extract-default-export/index.js';
import { extractNamedSpecifiersExports } from './_utils/extract-named-specifiers-exports/index.js';

export function extractModuleExports(
  body: readonly Statement[],
  rootSymbols: readonly TRootSymbol[],
  importedBindings: ReadonlyMap<string, TImportedBinding>,
  locator: TSourceLocator
): readonly TModuleExport[] {
  const exports: TModuleExport[] = [];
  const seenExportNames = new Set<string>();

  const processStatement = (statement: Statement): void => {
    if (statement.type === 'ExportNamedDeclaration') {
      if (statement.declaration === null) {
        extractNamedSpecifiersExports(
          statement,
          rootSymbols,
          importedBindings,
          locator,
          exports
        );
      } else {
        extractDeclarationExports(
          statement.declaration,
          locator,
          exports,
          seenExportNames
        );
      }
      return;
    }

    if (statement.type === 'ExportAllDeclaration') {
      exports.push(extractAllExport(statement, locator));
      return;
    }

    if (statement.type === 'ExportDefaultDeclaration') {
      exports.push(
        extractDefaultExport(statement, rootSymbols, importedBindings, locator)
      );
    }
  };

  for (const statement of body) {
    processStatement(statement);
  }

  return exports;
}
