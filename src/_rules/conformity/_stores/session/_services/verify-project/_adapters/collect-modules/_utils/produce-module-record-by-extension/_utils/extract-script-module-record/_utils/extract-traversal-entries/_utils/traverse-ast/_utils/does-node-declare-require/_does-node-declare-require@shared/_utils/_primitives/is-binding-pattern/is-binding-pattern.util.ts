import type { BindingPattern, BindingRestElement } from 'oxc-parser';

import { BINDING_PATTERN_TYPES } from '../../../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';

export function isBindingPattern(
  value: unknown
): value is BindingPattern | BindingRestElement {
  return isAstNode(value) && BINDING_PATTERN_TYPES.has(value.type);
}
