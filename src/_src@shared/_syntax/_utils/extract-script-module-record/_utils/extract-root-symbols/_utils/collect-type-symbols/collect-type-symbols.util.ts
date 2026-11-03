import type {
  TSInterfaceDeclaration,
  TSTypeAliasDeclaration,
} from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

export function collectTypeSymbols(
  statement: TSInterfaceDeclaration | TSTypeAliasDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void {
  symbols.push({
    name: statement.id.name,
    position: locator(statement.id.start),
    space: 'type',
  });
}
