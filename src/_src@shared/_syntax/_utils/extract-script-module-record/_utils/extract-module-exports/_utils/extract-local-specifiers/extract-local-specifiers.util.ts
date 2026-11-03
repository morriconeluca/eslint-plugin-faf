import type { ExportNamedDeclaration } from 'oxc-parser';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../_types/module-record.type.js';
import type {
  TImportedBinding,
  TSourceLocator,
} from '../../../../extract-script-module-record.type.js';

import {
  IMPORTED_BINDING_ORIGIN,
  LOCAL_SYMBOL_ORIGIN,
  NAMESPACE_ORIGIN,
} from '../../extract-module-exports.constant.js';
import { getExportedName } from '../get-exported-name/index.js';
import { isAllTypeSpace } from '../is-all-type-space/index.js';

export function extractLocalSpecifiers(
  statement: ExportNamedDeclaration,
  rootSymbols: readonly TRootSymbol[],
  importedBindings: ReadonlyMap<string, TImportedBinding>,
  locator: TSourceLocator,
  exports: TModuleExport[]
): void {
  const isDeclarationTypeOnly = statement.exportKind === 'type';

  for (const specifier of statement.specifiers) {
    const exportedName = getExportedName(specifier.exported);
    const localName = getExportedName(specifier.local);
    const position = locator(specifier.start);
    const binding = importedBindings.get(localName);

    if (binding === undefined) {
      const isTypeOnly =
        isDeclarationTypeOnly ||
        specifier.exportKind === 'type' ||
        isAllTypeSpace(localName, rootSymbols);

      exports.push({
        exportedName,
        isTypeOnly,
        origin: { symbolName: localName, type: LOCAL_SYMBOL_ORIGIN },
        position,
      });
    } else {
      const isTypeOnly =
        isDeclarationTypeOnly ||
        specifier.exportKind === 'type' ||
        binding.isTypeOnly;

      const origin = binding.isNamespace
        ? { specifier: binding.specifier, type: NAMESPACE_ORIGIN }
        : {
            importedName: binding.importedName,
            specifier: binding.specifier,
            type: IMPORTED_BINDING_ORIGIN,
          };

      exports.push({ exportedName, isTypeOnly, origin, position });
    }
  }
}
