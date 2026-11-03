import type { Class, TSEnumDeclaration } from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

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
