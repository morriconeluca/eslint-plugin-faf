import type { TAstNode } from '../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import {
  FUNCTION_AST_TYPES,
  REQUIRE_NAME,
} from '../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { doesStatementDeclareRequire } from './_does-node-declare-require@shared/_utils/_compounds/does-statement-declare-require/index.js';
import { doesPatternBindRequire } from './_does-node-declare-require@shared/_utils/_primitives/does-pattern-bind-require/index.js';
import { isBindingPattern } from './_does-node-declare-require@shared/_utils/_primitives/is-binding-pattern/index.js';
import { isStatement } from './_does-node-declare-require@shared/_utils/_primitives/is-statement/index.js';
import { doesFunctionDeclareRequire } from './_utils/does-function-declare-require/index.js';

export function doesNodeDeclareRequire(
  node: TAstNode,
  name: string = REQUIRE_NAME
): boolean {
  if (node.type === 'Program' || node.type === 'BlockStatement') {
    const body = node['body'];
    return (
      Array.isArray(body) &&
      body
        .filter(isStatement)
        .some((statement) => doesStatementDeclareRequire(statement, name))
    );
  }

  if (FUNCTION_AST_TYPES.has(node.type)) {
    return doesFunctionDeclareRequire(node, name);
  }

  if (node.type === 'CatchClause') {
    const parameter = node['param'];
    return (
      isBindingPattern(parameter) && doesPatternBindRequire(parameter, name)
    );
  }

  return false;
}
