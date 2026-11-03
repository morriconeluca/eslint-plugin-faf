import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { REQUIRE_NAME } from '../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { handleImportExpression } from './_utils/handle-import-expression/index.js';
import { handleRequireCall } from './_utils/handle-require-call/index.js';
import { handleTsImportType } from './_utils/handle-ts-import-type/index.js';
import { handleUnsupportedSyntax } from './_utils/handle-unsupported-syntax/index.js';

export function handleSpecificNode(
  node: TAstNode,
  isRequireShadowed: boolean,
  locator: TSourceLocator,
  inlineImports: TModuleImport[],
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  if (node.type === 'CallExpression') {
    const callee = node['callee'];
    if (
      !isRequireShadowed &&
      isAstNode(callee) &&
      callee.type === 'Identifier' &&
      callee['name'] === REQUIRE_NAME
    ) {
      handleRequireCall(node, locator, inlineImports, unsupportedSyntaxes);
    }
    return;
  }

  if (node.type === 'ImportExpression') {
    handleImportExpression(node, locator, inlineImports);
    return;
  }

  if (node.type === 'TSImportType') {
    handleTsImportType(node, locator, inlineImports);
    return;
  }

  handleUnsupportedSyntax(node, locator, unsupportedSyntaxes);
}
