import type { TSGlobalDeclaration, TSModuleDeclaration } from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

import { hasValueDeclaration } from '../has-value-declaration/index.js';

export function collectNamespaceSymbols(
  statement: TSGlobalDeclaration | TSModuleDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void {
  if (statement.kind !== 'namespace' || statement.id.type !== 'Identifier') {
    return;
  }
  const space = hasValueDeclaration(statement.body) ? 'value' : 'type';
  symbols.push({
    name: statement.id.name,
    position: locator(statement.id.start),
    space,
  });
}
