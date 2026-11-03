import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../extract-script-module-record.type.js';
import type { TAstNode } from '../../../../extract-traversal-entries.type.js';

import { REQUIRE_NAME } from '../../../../extract-traversal-entries.constant.js';
import { handleImportExpression } from '../../../handle-import-expression/index.js';
import { handleRequireCall } from '../../../handle-require-call/index.js';
import { handleTsImportType } from '../../../handle-ts-import-type/index.js';
import { handleUnsupportedSyntax } from '../../../handle-unsupported-syntax/index.js';
import { isRecord } from '../../../is-record/index.js';

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
      isRecord(callee) &&
      callee['type'] === 'Identifier' &&
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
