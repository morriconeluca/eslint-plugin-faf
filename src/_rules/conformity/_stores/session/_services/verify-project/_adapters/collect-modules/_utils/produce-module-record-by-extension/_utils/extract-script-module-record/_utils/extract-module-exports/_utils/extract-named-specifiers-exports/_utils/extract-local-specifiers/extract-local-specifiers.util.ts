import type { ExportNamedDeclaration } from 'oxc-parser';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportedBinding } from '../../../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import {
  IMPORTED_BINDING_ORIGIN,
  LOCAL_SYMBOL_ORIGIN,
  NAMESPACE_ORIGIN,
} from '../../../../_extract-module-exports@shared/_constants/module-exports.constant.js';
import { getExportedName } from '../../../../_extract-module-exports@shared/_utils/get-exported-name/index.js';
import { isAllTypeSpace } from '../../../../_extract-module-exports@shared/_utils/is-all-type-space/index.js';
import { isLocalTypeExport } from './_utils/is-local-type-export/index.js';

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
    const isExplicitlyTypeOnly =
      isDeclarationTypeOnly || specifier.exportKind === 'type';

    if (
      binding === undefined ||
      isLocalTypeExport(isExplicitlyTypeOnly, binding, localName, rootSymbols)
    ) {
      const isTypeOnly =
        isExplicitlyTypeOnly || isAllTypeSpace(localName, rootSymbols);

      exports.push({
        exportedName,
        isTypeOnly,
        origin: { symbolName: localName, type: LOCAL_SYMBOL_ORIGIN },
        position,
      });
    } else {
      const isTypeOnly = isExplicitlyTypeOnly || binding.isTypeOnly;

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
