import type { ExportAllDeclaration, ExportNamedDeclaration } from 'oxc-parser';

import type { TModuleImport } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

export function extractStaticExport(
  statement: ExportAllDeclaration | ExportNamedDeclaration,
  locator: TSourceLocator
): null | TModuleImport {
  if (statement.type === 'ExportAllDeclaration') {
    const isTypeOnly = statement.exportKind === 'type';
    const kind = isTypeOnly ? 'export-type-from' : 'export-all-from';
    return {
      isTypeOnly,
      kind,
      position: locator(statement.start),
      specifier: statement.source.value,
    };
  }

  if (statement.source === null) {
    return null;
  }

  const isTypeOnly =
    statement.exportKind === 'type' ||
    (statement.specifiers.length > 0 &&
      statement.specifiers.every(
        (specifierItem) => specifierItem.exportKind === 'type'
      ));
  const kind = isTypeOnly ? 'export-type-from' : 'export-named-from';

  return {
    isTypeOnly,
    kind,
    position: locator(statement.start),
    specifier: statement.source.value,
  };
}
