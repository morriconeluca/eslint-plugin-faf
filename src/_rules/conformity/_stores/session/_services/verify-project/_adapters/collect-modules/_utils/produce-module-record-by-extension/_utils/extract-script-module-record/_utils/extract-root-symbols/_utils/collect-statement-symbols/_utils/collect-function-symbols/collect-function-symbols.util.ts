import type { TRootSymbol } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TFunctionDeclaration } from './collect-function-symbols.type.js';

export function collectFunctionSymbols(
  statement: TFunctionDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[],
  seenFunctions: Set<string>
): void {
  if (statement.id === null) {
    symbols.push({
      name: 'default',
      position: locator(statement.start),
      space: 'value',
    });
    return;
  }
  const name = statement.id.name;
  if (seenFunctions.has(name)) {
    return;
  }
  seenFunctions.add(name);
  symbols.push({
    name,
    position: locator(statement.id.start),
    space: 'value',
  });
}
