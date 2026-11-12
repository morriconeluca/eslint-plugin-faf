import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { REQUIRE_NAME } from '../../../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { doesStatementDeclareRequire } from '../../_does-node-declare-require@shared/_utils/_compounds/does-statement-declare-require/index.js';
import { doesPatternBindRequire } from '../../_does-node-declare-require@shared/_utils/_primitives/does-pattern-bind-require/index.js';
import { isBindingPattern } from '../../_does-node-declare-require@shared/_utils/_primitives/is-binding-pattern/index.js';
import { isStatement } from '../../_does-node-declare-require@shared/_utils/_primitives/is-statement/index.js';

export function doesFunctionDeclareRequire(
  node: TAstNode,
  name: string = REQUIRE_NAME
): boolean {
  const id = node['id'];
  if (isAstNode(id) && id['name'] === name) {
    return true;
  }
  const parameters = node['params'];
  if (
    Array.isArray(parameters) &&
    parameters.some(
      (parameter) =>
        isBindingPattern(parameter) && doesPatternBindRequire(parameter, name)
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
        .some((statement) => doesStatementDeclareRequire(statement, name));
    }
  }
  return false;
}
