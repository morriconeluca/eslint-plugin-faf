import type { TAstNode } from '../../../../../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { EXPORTS_NAME } from '../../../../../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../../../../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { extractStaticSpecifier } from '../../../../../../_handle-specific-node@shared/_utils/extract-static-specifier/index.js';

export function isExportsProperty(node: TAstNode): boolean {
  const property = node['property'];
  if (!isAstNode(property)) {
    return false;
  }

  if (node['computed'] === true) {
    return extractStaticSpecifier(property) === EXPORTS_NAME;
  }

  return property.type === 'Identifier' && property['name'] === EXPORTS_NAME;
}
