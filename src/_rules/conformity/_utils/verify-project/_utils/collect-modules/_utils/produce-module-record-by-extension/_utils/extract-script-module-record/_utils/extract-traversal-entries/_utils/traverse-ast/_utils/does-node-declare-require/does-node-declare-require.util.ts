import type { TAstNode } from '../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import {
  FUNCTION_AST_TYPES,
  REQUIRE_NAME,
} from '../../_traverse-ast@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../_traverse-ast@shared/_utils/is-ast-node/index.js';
import { doesPatternBindRequire } from './_does-node-declare-require@shared/_utils/does-pattern-bind-require/index.js';
import { isBindingPattern } from './_does-node-declare-require@shared/_utils/is-binding-pattern/index.js';
import { isStatement } from './_does-node-declare-require@shared/_utils/is-statement/index.js';
import { doesStatementDeclareRequire } from './_utils/does-statement-declare-require/index.js';

export const doesNodeDeclareRequire = (() => {
  const doesFunctionDeclareRequire = (
    functionNode: TAstNode,
    name: string
  ): boolean => {
    const id = functionNode['id'];
    if (isAstNode(id) && id['name'] === name) {
      return true;
    }
    const parameters = functionNode['params'];
    if (
      Array.isArray(parameters) &&
      parameters.some(
        (parameter) =>
          isBindingPattern(parameter) && doesPatternBindRequire(parameter, name)
      )
    ) {
      return true;
    }
    const body = functionNode['body'];
    if (isAstNode(body)) {
      const inner = body['body'];
      if (Array.isArray(inner)) {
        return inner
          .filter(isStatement)
          .some((statement) => doesStatementDeclareRequire(statement, name));
      }
    }
    return false;
  };

  return function doesNodeDeclareRequire(
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
  };
})();
