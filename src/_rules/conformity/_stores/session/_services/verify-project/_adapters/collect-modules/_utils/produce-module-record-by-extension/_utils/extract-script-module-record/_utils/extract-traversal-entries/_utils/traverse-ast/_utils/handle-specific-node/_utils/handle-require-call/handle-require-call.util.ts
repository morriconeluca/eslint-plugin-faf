import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { UNSUPPORTED_REQUIRE_MESSAGE } from '../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { extractStaticSpecifier } from '../../_handle-specific-node@shared/_utils/extract-static-specifier/index.js';

export function handleRequireCall(
  call: TAstNode,
  locator: TSourceLocator,
  inlineImports: TModuleImport[],
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  const start = typeof call['start'] === 'number' ? call['start'] : 0;
  const position = locator(start);
  const callArguments = call['arguments'];
  const isSingleElement = (value: null | object): value is readonly [unknown] =>
    value === callArguments && Array.isArray(value) && value.length === 1;

  if (typeof callArguments !== 'object' || !isSingleElement(callArguments)) {
    unsupportedSyntaxes.push({
      description: UNSUPPORTED_REQUIRE_MESSAGE,
      position,
    });
    return;
  }

  const argument = callArguments[0];
  const specifier = isAstNode(argument)
    ? extractStaticSpecifier(argument)
    : null;
  if (specifier !== null) {
    inlineImports.push({
      isTypeOnly: false,
      kind: 'require-call',
      position,
      specifier,
    });
    return;
  }

  unsupportedSyntaxes.push({
    description: UNSUPPORTED_REQUIRE_MESSAGE,
    position,
  });
}
