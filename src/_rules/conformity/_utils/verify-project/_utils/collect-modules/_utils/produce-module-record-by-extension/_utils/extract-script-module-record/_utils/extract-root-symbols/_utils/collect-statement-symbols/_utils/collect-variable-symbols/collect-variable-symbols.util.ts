import type { VariableDeclaration } from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { collectPatternBindings } from './_utils/collect-pattern-bindings/index.js';

export function collectVariableSymbols(
  statement: VariableDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void {
  for (const declarator of statement.declarations) {
    collectPatternBindings(declarator.id, locator, symbols);
  }
}
