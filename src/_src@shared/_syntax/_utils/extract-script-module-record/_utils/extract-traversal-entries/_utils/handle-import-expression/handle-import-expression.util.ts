import type { TModuleImport } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';
import type { TAstNode } from '../../extract-traversal-entries.type.js';

import { extractStaticSpecifier } from '../extract-static-specifier/index.js';

export function handleImportExpression(
  expression: TAstNode,
  locator: TSourceLocator,
  inlineImports: TModuleImport[]
): void {
  const start =
    typeof expression['start'] === 'number' ? expression['start'] : 0;
  const position = locator(start);
  const specifier = extractStaticSpecifier(expression['source']);

  if (specifier !== null) {
    inlineImports.push({
      isTypeOnly: false,
      kind: 'literal-dynamic-import',
      position,
      specifier,
    });
    return;
  }

  inlineImports.push({
    isTypeOnly: false,
    kind: 'non-literal-dynamic-import',
    position,
    specifier: null,
  });
}
