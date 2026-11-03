import type { TAstNode } from '../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { isAstNode } from './_utils/is-ast-node/index.js';

export function visitChildren(
  node: TAstNode,
  visitor: (child: TAstNode) => void
): void {
  const elements = Object.values(node).flat();
  for (const item of elements) {
    if (isAstNode(item)) {
      visitor(item);
    }
  }
}
