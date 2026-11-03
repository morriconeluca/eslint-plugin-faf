import type { Statement } from 'oxc-parser';

import type { TRootSymbol } from '../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { collectStatementSymbols } from './_utils/collect-statement-symbols/index.js';
import { extractDefaultDeclaration } from './_utils/extract-default-declaration/index.js';

export function extractRootSymbols(
  body: readonly Statement[],
  locator: TSourceLocator,
  importedNames: ReadonlySet<string>
): readonly TRootSymbol[] {
  const symbols: TRootSymbol[] = [];
  const seenFunctions = new Set<string>();

  for (const statement of body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      continue;
    }

    const target =
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration !== null
        ? statement.declaration
        : statement;

    collectStatementSymbols(target, locator, symbols, seenFunctions);
  }

  for (const statement of body) {
    if (statement.type !== 'ExportDefaultDeclaration') {
      continue;
    }
    extractDefaultDeclaration(
      statement,
      locator,
      symbols,
      seenFunctions,
      importedNames
    );
  }

  return symbols;
}
