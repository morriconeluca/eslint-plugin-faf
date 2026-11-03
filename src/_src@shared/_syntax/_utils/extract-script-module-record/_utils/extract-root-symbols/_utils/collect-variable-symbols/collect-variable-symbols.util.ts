import type { VariableDeclaration } from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

import { collectPatternBindings } from '../collect-pattern-bindings/index.js';

export function collectVariableSymbols(
  statement: VariableDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void {
  for (const declarator of statement.declarations) {
    collectPatternBindings(declarator.id, locator, symbols);
  }
}
