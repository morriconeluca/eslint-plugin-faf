import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';
import type { TAstNode } from '../../extract-traversal-entries.type.js';

import { UNSUPPORTED_REQUIRE_MESSAGE } from '../../extract-traversal-entries.constant.js';
import { extractStaticSpecifier } from '../extract-static-specifier/index.js';

export function handleRequireCall(
  call: TAstNode,
  locator: TSourceLocator,
  inlineImports: TModuleImport[],
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  const start = typeof call['start'] === 'number' ? call['start'] : 0;
  const position = locator(start);
  const callArguments = call['arguments'];

  if (!Array.isArray(callArguments) || callArguments.length !== 1) {
    unsupportedSyntaxes.push({
      description: UNSUPPORTED_REQUIRE_MESSAGE,
      position,
    });
    return;
  }

  const specifier = extractStaticSpecifier(callArguments[0]);
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
