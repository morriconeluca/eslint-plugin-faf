import type { Statement } from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';

import { collectClassOrEnumSymbols } from '../collect-class-or-enum-symbols/index.js';
import { collectFunctionSymbols } from '../collect-function-symbols/index.js';
import { collectNamespaceSymbols } from '../collect-namespace-symbols/index.js';
import { collectTypeSymbols } from '../collect-type-symbols/index.js';
import { collectVariableSymbols } from '../collect-variable-symbols/index.js';

export function collectStatementSymbols(
  target: Statement,
  locator: TSourceLocator,
  symbols: TRootSymbol[],
  seenFunctions: Set<string>
): void {
  if (target.type === 'VariableDeclaration') {
    collectVariableSymbols(target, locator, symbols);
    return;
  }
  if (target.type === 'TSModuleDeclaration') {
    collectNamespaceSymbols(target, locator, symbols);
    return;
  }
  if (
    target.type === 'FunctionDeclaration' ||
    target.type === 'TSDeclareFunction'
  ) {
    collectFunctionSymbols(target, locator, symbols, seenFunctions);
    return;
  }
  if (
    target.type === 'ClassDeclaration' ||
    target.type === 'TSEnumDeclaration'
  ) {
    collectClassOrEnumSymbols(target, locator, symbols);
    return;
  }
  if (
    target.type === 'TSInterfaceDeclaration' ||
    target.type === 'TSTypeAliasDeclaration'
  ) {
    collectTypeSymbols(target, locator, symbols);
  }
}
