import type { TAstNode } from '../../extract-traversal-entries.type.js';

import { FUNCTION_AST_TYPES } from '../../extract-traversal-entries.constant.js';
import { doesPatternBindRequire } from '../does-pattern-bind-require/index.js';
import { isBindingPattern } from '../is-binding-pattern/index.js';
import { isStatement } from '../is-statement/index.js';
import { doesFunctionDeclareRequire } from './_utils/does-function-declare-require/index.js';
import { doesStatementDeclareRequire } from './_utils/does-statement-declare-require/index.js';

export function doesNodeDeclareRequire(node: TAstNode): boolean {
  if (node.type === 'Program' || node.type === 'BlockStatement') {
    const body = node['body'];
    return (
      Array.isArray(body) &&
      body
        .filter(isStatement)
        .some((statement) => doesStatementDeclareRequire(statement))
    );
  }

  if (FUNCTION_AST_TYPES.has(node.type)) {
    return doesFunctionDeclareRequire(node);
  }

  if (node.type === 'CatchClause') {
    const parameter = node['param'];
    return isBindingPattern(parameter) && doesPatternBindRequire(parameter);
  }

  return false;
}
