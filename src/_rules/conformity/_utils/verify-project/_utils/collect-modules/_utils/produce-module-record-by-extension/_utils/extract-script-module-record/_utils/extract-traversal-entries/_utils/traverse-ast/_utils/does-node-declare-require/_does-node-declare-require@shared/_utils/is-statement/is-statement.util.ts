import type { Statement } from 'oxc-parser';

import { isAstNode } from '../../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';

export function isStatement(value: unknown): value is Statement {
  return isAstNode(value);
}
