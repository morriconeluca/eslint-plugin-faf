import type { ExportNamedDeclaration } from 'oxc-parser';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TImportedBinding } from '../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import {
  IMPORTED_BINDING_ORIGIN,
  LOCAL_SYMBOL_ORIGIN,
  NAMESPACE_ORIGIN,
} from '../../_extract-module-exports@shared/_constants/module-exports.constant.js';

export function extractNamedSpecifiersExports(
  statement: ExportNamedDeclaration,
  rootSymbols: readonly TRootSymbol[],
  importedBindings: ReadonlyMap<string, TImportedBinding>,
  locator: TSourceLocator,
  exports: TModuleExport[]
): void {
  const isAllTypeSpace = (name: string): boolean => {
    const matching = rootSymbols.filter((symbol) => symbol.name === name);
    return (
      matching.length > 0 && matching.every((symbol) => symbol.space === 'type')
    );
  };

  const isLocalTypeExport = (
    isExplicitlyTypeOnly: boolean,
    binding: TImportedBinding | undefined,
    localName: string
  ): boolean =>
    isExplicitlyTypeOnly &&
    binding !== undefined &&
    !binding.isTypeOnly &&
    rootSymbols.some(
      (symbol) => symbol.name === localName && symbol.space === 'type'
    );

  const extractReExportSpecifiers = (sourceSpecifier: string): void => {
    const isDeclarationTypeOnly = statement.exportKind === 'type';
    for (const specifier of statement.specifiers) {
      const exportedName =
        specifier.exported.type === 'Literal'
          ? specifier.exported.value
          : specifier.exported.name;
      const importedName =
        specifier.local.type === 'Literal'
          ? specifier.local.value
          : specifier.local.name;
      const isTypeOnly =
        isDeclarationTypeOnly || specifier.exportKind === 'type';
      exports.push({
        exportedName,
        isTypeOnly,
        origin: {
          importedName,
          specifier: sourceSpecifier,
          type: IMPORTED_BINDING_ORIGIN,
        },
        position: locator(specifier.start),
      });
    }
  };

  const extractLocalSpecifiers = (): void => {
    const isDeclarationTypeOnly = statement.exportKind === 'type';

    for (const specifier of statement.specifiers) {
      const exportedName =
        specifier.exported.type === 'Literal'
          ? specifier.exported.value
          : specifier.exported.name;
      const localName =
        specifier.local.type === 'Literal'
          ? specifier.local.value
          : specifier.local.name;
      const position = locator(specifier.start);
      const binding = importedBindings.get(localName);
      const isExplicitlyTypeOnly =
        isDeclarationTypeOnly || specifier.exportKind === 'type';

      if (
        binding === undefined ||
        isLocalTypeExport(isExplicitlyTypeOnly, binding, localName)
      ) {
        const isTypeOnly = isExplicitlyTypeOnly || isAllTypeSpace(localName);

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
  };

  if (statement.source === null) {
    extractLocalSpecifiers();
  } else {
    extractReExportSpecifiers(statement.source.value);
  }
}
