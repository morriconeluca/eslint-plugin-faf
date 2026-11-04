import type { ExportDefaultDeclaration } from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

export function extractDefaultDeclaration(
  statement: ExportDefaultDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[],
  seenFunctions: Set<string>,
  importedNames: ReadonlySet<string>
): void {
  const declaration = statement.declaration;
  if (declaration.type === 'ClassDeclaration') {
    const name = declaration.id?.name ?? 'default';
    symbols.push({
      name,
      position: locator(statement.start),
      space: 'value',
    });
    return;
  }
  if (declaration.type === 'FunctionDeclaration') {
    if (declaration.id === null) {
      symbols.push({
        name: 'default',
        position: locator(statement.start),
        space: 'value',
      });
      return;
    }
    const name = declaration.id.name;
    if (seenFunctions.has(name)) {
      return;
    }
    seenFunctions.add(name);
    symbols.push({
      name,
      position: locator(declaration.id.start),
      space: 'value',
    });
    return;
  }
  if (declaration.type === 'Identifier') {
    const name = declaration.name;
    const isKnown =
      symbols.some((symbol) => symbol.name === name) || importedNames.has(name);
    if (!isKnown) {
      symbols.push({
        name: 'default',
        position: locator(declaration.start),
        space: 'value',
      });
    }
    return;
  }
  symbols.push({
    name: 'default',
    position: locator(declaration.start),
    space: 'value',
  });
}
