import type { TModuleImport } from '../../../../../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { extractStaticSpecifier } from '../../_handle-specific-node@shared/_utils/extract-static-specifier/index.js';

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
