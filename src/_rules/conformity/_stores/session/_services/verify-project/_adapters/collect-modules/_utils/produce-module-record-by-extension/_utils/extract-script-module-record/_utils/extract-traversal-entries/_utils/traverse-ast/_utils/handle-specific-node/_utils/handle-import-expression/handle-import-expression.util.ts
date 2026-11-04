import type { TModuleImport } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { isAstNode } from '../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { extractStaticSpecifier } from '../../_handle-specific-node@shared/_utils/extract-static-specifier/index.js';

export function handleImportExpression(
  expression: TAstNode,
  locator: TSourceLocator,
  inlineImports: TModuleImport[]
): void {
  const start =
    typeof expression['start'] === 'number' ? expression['start'] : 0;
  const position = locator(start);
  const source = expression['source'];
  const specifier = isAstNode(source) ? extractStaticSpecifier(source) : null;

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
