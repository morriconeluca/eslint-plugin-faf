import { type OxcError, parseSync } from 'oxc-parser';

import type {
  TModuleImport,
  TModuleRecord,
  TUnsupportedSyntax,
} from '../../../../../../_conformity@shared/_types/verification-model.type.js';

import { compareSourceLocations } from '../../../../../../_conformity@shared/_utils/compare-source-locations/index.js';
import { createSourceLocator } from './_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractModuleExports } from './_utils/extract-module-exports/index.js';
import { extractRootSymbols } from './_utils/extract-root-symbols/index.js';
import { extractStaticImports } from './_utils/extract-static-imports/index.js';
import { extractTraversalEntries } from './_utils/extract-traversal-entries/index.js';

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

  const extractParseErrors = (
    errors: readonly OxcError[]
  ): readonly TUnsupportedSyntax[] =>
    errors.map((error) => {
      const firstLabel = error.labels[0];
      const start = firstLabel === undefined ? 0 : firstLabel.start;
      return {
        description: error.message,
        position: locator(start),
      };
    });

  const parseErrors = extractParseErrors(parseResult.errors);

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

  const allImports: TModuleImport[] = [
    ...staticImports,
    ...traversal.inlineImports,
  ];
  allImports.sort((first, second) =>
    compareSourceLocations(first.position, second.position)
  );

  const allUnsupported: TUnsupportedSyntax[] = [
    ...parseErrors,
    ...traversal.unsupportedSyntaxes,
  ];
  allUnsupported.sort((first, second) =>
    compareSourceLocations(first.position, second.position)
  );

  const sortedSymbols = [...symbols];
  sortedSymbols.sort((first, second) =>
    compareSourceLocations(first.position, second.position)
  );

  return {
    exports,
    imports: allImports,
    language: 'script',
    symbols: sortedSymbols,
    unsupportedSyntaxes: allUnsupported,
  };
}
