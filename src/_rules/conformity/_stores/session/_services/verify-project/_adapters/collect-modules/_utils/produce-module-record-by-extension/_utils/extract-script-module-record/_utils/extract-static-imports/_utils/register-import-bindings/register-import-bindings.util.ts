import type { ImportDeclaration } from 'oxc-parser';

import type { TImportedBinding } from '../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';

export function registerImportBindings(
  statement: ImportDeclaration,
  specifier: string,
  bindingMap: Map<string, TImportedBinding>
): void {
  const isStatementType = statement.importKind === 'type';
  const registerSpecifier = (
    item: ImportDeclaration['specifiers'][number]
  ): void => {
    switch (item.type) {
      case 'ImportDefaultSpecifier': {
        bindingMap.set(item.local.name, {
          importedName: 'default',
          isNamespace: false,
          isTypeOnly: isStatementType,
          localName: item.local.name,
          specifier,
        });
        return;
      }
      case 'ImportNamespaceSpecifier': {
        bindingMap.set(item.local.name, {
          importedName: '*',
          isNamespace: true,
          isTypeOnly: isStatementType,
          localName: item.local.name,
          specifier,
        });
        return;
      }
      case 'ImportSpecifier': {
        const importedName =
          item.imported.type === 'Literal'
            ? item.imported.value
            : item.imported.name;
        const isType = isStatementType || item.importKind === 'type';
        bindingMap.set(item.local.name, {
          importedName,
          isNamespace: false,
          isTypeOnly: isType,
          localName: item.local.name,
          specifier,
        });
        return;
      }
    }
  };

  for (const item of statement.specifiers) {
    registerSpecifier(item);
  }
}
