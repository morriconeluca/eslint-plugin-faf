import { type OxcError, parseSync } from 'oxc-parser';

import type { TSourceLocation } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TModuleImport,
  TModuleRecord,
  TUnsupportedSyntax,
} from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TSourceLocator } from './_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { compareSourceLocations } from '../../../../../../_verify-project@shared/_utils/compare-source-locations/index.js';
import { createSourceLocator } from './_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractModuleExports } from './_utils/extract-module-exports/index.js';
import { extractRootSymbols } from './_utils/extract-root-symbols/index.js';
import { extractStaticImports } from './_utils/extract-static-imports/index.js';
import { extractTraversalEntries } from './_utils/extract-traversal-entries/index.js';

export const extractScriptModuleRecord = (() => {
  const extractParseErrors = (
    errors: readonly OxcError[],
    locator: TSourceLocator
  ): readonly TUnsupportedSyntax[] =>
    errors.map((error) => {
      const firstLabel = error.labels[0];
      const start = firstLabel === undefined ? 0 : firstLabel.start;
      return {
        description: error.message,
        position: locator(start),
      };
    });

  const sortByPosition = <T extends { readonly position: TSourceLocation }>(
    items: readonly T[]
  ): readonly T[] => {
    const elements = [...items];
    elements.sort((first, second) =>
      compareSourceLocations(first.position, second.position)
    );
    return elements;
  };

  return function extractScriptModuleRecord(
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
  };
})();
