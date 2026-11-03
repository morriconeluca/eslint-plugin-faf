import type { TSImportEqualsDeclaration } from 'oxc-parser';

import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';
import type { TExtractedImportEquals } from './extract-import-equals.type.js';

export function extractImportEquals(
  statement: TSImportEqualsDeclaration,
  locator: TSourceLocator
): null | TExtractedImportEquals {
  if (statement.moduleReference.type !== 'TSExternalModuleReference') {
    return null;
  }

  const specifier = statement.moduleReference.expression.value;
  const isTypeOnly = statement.importKind === 'type';

  return {
    binding: {
      importedName: 'default',
      isNamespace: false,
      isTypeOnly,
      localName: statement.id.name,
      specifier,
    },
    staticImport: {
      isTypeOnly,
      kind: 'typescript-require-import',
      position: locator(statement.start),
      specifier,
    },
  };
}
