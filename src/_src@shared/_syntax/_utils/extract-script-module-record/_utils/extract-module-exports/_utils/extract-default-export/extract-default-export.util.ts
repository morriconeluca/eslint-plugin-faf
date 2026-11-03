import type { ExportDefaultDeclaration } from 'oxc-parser';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../_types/module-record.type.js';
import type {
  TImportedBinding,
  TSourceLocator,
} from '../../../../extract-script-module-record.type.js';

import {
  DEFAULT_NAME,
  IMPORTED_BINDING_ORIGIN,
  LOCAL_SYMBOL_ORIGIN,
  NAMESPACE_ORIGIN,
} from '../../extract-module-exports.constant.js';
import { isAllTypeSpace } from '../is-all-type-space/index.js';

export function extractDefaultExport(
  statement: ExportDefaultDeclaration,
  rootSymbols: readonly TRootSymbol[],
  importedBindings: ReadonlyMap<string, TImportedBinding>,
  locator: TSourceLocator
): TModuleExport {
  const declaration = statement.declaration;
  const position = locator(statement.start);

  if (declaration.type === 'ClassDeclaration') {
    const symbolName = declaration.id?.name ?? DEFAULT_NAME;
    return {
      exportedName: DEFAULT_NAME,
      isTypeOnly: false,
      origin: { symbolName, type: LOCAL_SYMBOL_ORIGIN },
      position,
    };
  }

  if (declaration.type === 'FunctionDeclaration') {
    const symbolName = declaration.id?.name ?? DEFAULT_NAME;
    return {
      exportedName: DEFAULT_NAME,
      isTypeOnly: false,
      origin: { symbolName, type: LOCAL_SYMBOL_ORIGIN },
      position,
    };
  }

  if (declaration.type === 'Identifier') {
    const name = declaration.name;
    const binding = importedBindings.get(name);
    if (binding !== undefined) {
      if (binding.isNamespace) {
        return {
          exportedName: DEFAULT_NAME,
          isTypeOnly: binding.isTypeOnly,
          origin: { specifier: binding.specifier, type: NAMESPACE_ORIGIN },
          position,
        };
      }
      return {
        exportedName: DEFAULT_NAME,
        isTypeOnly: binding.isTypeOnly,
        origin: {
          importedName: binding.importedName,
          specifier: binding.specifier,
          type: IMPORTED_BINDING_ORIGIN,
        },
        position,
      };
    }
    const isTypeOnly = isAllTypeSpace(name, rootSymbols);
    return {
      exportedName: DEFAULT_NAME,
      isTypeOnly,
      origin: { symbolName: name, type: LOCAL_SYMBOL_ORIGIN },
      position,
    };
  }

  return {
    exportedName: DEFAULT_NAME,
    isTypeOnly: false,
    origin: { symbolName: DEFAULT_NAME, type: LOCAL_SYMBOL_ORIGIN },
    position,
  };
}
