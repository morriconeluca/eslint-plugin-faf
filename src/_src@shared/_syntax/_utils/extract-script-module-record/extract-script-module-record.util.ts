import { parseSync } from 'oxc-parser';

import type {
  TModuleImport,
  TModuleRecord,
  TUnsupportedSyntax,
} from '../../_types/module-record.type.js';

import { createSourceLocator } from './_utils/create-source-locator/index.js';
import { extractModuleExports } from './_utils/extract-module-exports/index.js';
import { extractParseErrors } from './_utils/extract-parse-errors/index.js';
import { extractRootSymbols } from './_utils/extract-root-symbols/index.js';
import { extractStaticImports } from './_utils/extract-static-imports/index.js';
import { extractTraversalEntries } from './_utils/extract-traversal-entries/index.js';
import { sortByPosition } from './_utils/sort-by-position/index.js';

export function extractScriptModuleRecord(
  path: string,
  text: string
): TModuleRecord {
  const lang = path.includes('.') ? undefined : 'ts';
  const parseResult = parseSync(path, text, {
    lang,
    sourceType: 'module',
  });
  const locator = createSourceLocator(text);

  const parseErrors = extractParseErrors(parseResult.errors, locator);

  const { bindingMap, staticImports } = extractStaticImports(
    parseResult.program.body,
    locator
  );

  const importedNames = new Set(bindingMap.keys());
  const symbols = extractRootSymbols(
    parseResult.program.body,
    locator,
    importedNames
  );

  const exports = extractModuleExports(
    parseResult.program.body,
    symbols,
    bindingMap,
    locator
  );

  const traversal = extractTraversalEntries(parseResult.program, locator);

  const allImports: readonly TModuleImport[] = sortByPosition([
    ...staticImports,
    ...traversal.inlineImports,
  ]);

  const allUnsupported: readonly TUnsupportedSyntax[] = sortByPosition([
    ...parseErrors,
    ...traversal.unsupportedSyntaxes,
  ]);

  return {
    exports: sortByPosition(exports),
    imports: allImports,
    language: 'script',
    symbols: sortByPosition(symbols),
    unsupportedSyntaxes: allUnsupported,
  };
}
