import type { Class, TSEnumDeclaration } from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

export function collectClassOrEnumSymbols(
  statement: Class | TSEnumDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void {
  if (statement.id === null) {
    symbols.push({
      name: 'default',
      position: locator(statement.start),
      space: 'value',
    });
    return;
  }
  symbols.push({
    name: statement.id.name,
    position: locator(statement.id.start),
    space: 'value',
  });
}
