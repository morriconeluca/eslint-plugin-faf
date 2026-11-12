import type { TUnsupportedSyntax } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { UNSUPPORTED_COMMONJS_MESSAGE } from '../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { isCommonJsExportAssignment } from './_utils/is-commonjs-export-assignment/index.js';

export function handleUnsupportedSyntax(
  node: TAstNode,
  isModuleShadowed: boolean,
  isExportsShadowed: boolean,
  locator: TSourceLocator,
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  if (node.type === 'TSExportAssignment') {
    const start = typeof node['start'] === 'number' ? node['start'] : 0;
    unsupportedSyntaxes.push({
      description: 'TypeScript export assignment (export =) is unsupported',
      position: locator(start),
    });
    return;
  }

  if (node.type !== 'AssignmentExpression') {
    return;
  }

  const left = node['left'];
  if (
    !isAstNode(left) ||
    !isCommonJsExportAssignment(left, isModuleShadowed, isExportsShadowed)
  ) {
    return;
  }

  const start = typeof node['start'] === 'number' ? node['start'] : 0;
  unsupportedSyntaxes.push({
    description: UNSUPPORTED_COMMONJS_MESSAGE,
    position: locator(start),
  });
}
