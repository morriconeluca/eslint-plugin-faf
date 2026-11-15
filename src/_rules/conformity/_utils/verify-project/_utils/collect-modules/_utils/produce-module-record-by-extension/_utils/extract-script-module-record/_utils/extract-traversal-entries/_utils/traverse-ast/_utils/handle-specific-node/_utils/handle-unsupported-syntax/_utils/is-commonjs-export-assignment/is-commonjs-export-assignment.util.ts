import type { TAstNode } from '../../../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import {
  EXPORTS_NAME,
  MODULE_NAME,
} from '../../../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { isExportsProperty } from './_utils/is-exports-property/index.js';

export function isCommonJsExportAssignment(
  left: TAstNode,
  isModuleShadowed: boolean,
  isExportsShadowed: boolean
): boolean {
  if (left.type !== 'MemberExpression') {
    return false;
  }

  let current: TAstNode = left;
  let innermostOnModule: null | TAstNode = null;

  while (current.type === 'MemberExpression') {
    const object = current['object'];
    if (!isAstNode(object)) {
      return false;
    }
    if (object.type === 'Identifier') {
      if (object['name'] === EXPORTS_NAME) {
        return !isExportsShadowed;
      }
      if (object['name'] === MODULE_NAME) {
        innermostOnModule = current;
      }
    }
    current = object;
  }

  return (
    innermostOnModule !== null &&
    !isModuleShadowed &&
    isExportsProperty(innermostOnModule)
  );
}
