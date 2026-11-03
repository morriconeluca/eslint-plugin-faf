import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { REQUIRE_NAME } from '../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { doesPatternBindRequire } from '../../../../_traverse-ast@shared/_utils/does-pattern-bind-require/index.js';
import { isAstNode } from '../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { doesStatementDeclareRequire } from '../../_does-node-declare-require@shared/_utils/does-statement-declare-require/index.js';
import { isBindingPattern } from '../../_does-node-declare-require@shared/_utils/is-binding-pattern/index.js';
import { isStatement } from '../../_does-node-declare-require@shared/_utils/is-statement/index.js';

export function doesFunctionDeclareRequire(node: TAstNode): boolean {
  const id = node['id'];
  if (isAstNode(id) && id['name'] === REQUIRE_NAME) {
    return true;
  }
  const parameters = node['params'];
  if (
    Array.isArray(parameters) &&
    parameters.some(
      (parameter) =>
        isBindingPattern(parameter) && doesPatternBindRequire(parameter)
    )
  ) {
    return true;
  }
  const body = node['body'];
  if (isAstNode(body)) {
    const inner = body['body'];
    if (Array.isArray(inner)) {
      return inner
        .filter(isStatement)
        .some((statement) => doesStatementDeclareRequire(statement));
    }
  }
  return false;
}
