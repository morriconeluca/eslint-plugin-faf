import type { BindingPattern, BindingRestElement, Statement } from 'oxc-parser';

import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import {
  BINDING_PATTERN_TYPES,
  FUNCTION_AST_TYPES,
  REQUIRE_NAME,
} from '../../_extract-traversal-entries@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../_extract-traversal-entries@shared/_utils/is-ast-node/index.js';

export const doesNodeDeclareRequire = (() => {
  const isStatement = (value: unknown): value is Statement => isAstNode(value);

  const isBindingPattern = (
    value: unknown
  ): value is BindingPattern | BindingRestElement =>
    isAstNode(value) && BINDING_PATTERN_TYPES.has(value.type);

  const doesPatternBindRequire = (
    pattern: BindingPattern | BindingRestElement,
    name: string
  ): boolean => {
    let current: BindingPattern | BindingRestElement = pattern;
    while (
      current.type === 'AssignmentPattern' ||
      current.type === 'RestElement'
    ) {
      current =
        current.type === 'AssignmentPattern' ? current.left : current.argument;
    }

    if (current.type === 'Identifier') {
      return current.name === name;
    }

    if (current.type === 'ArrayPattern') {
      return current.elements.some(
        (element) => element !== null && doesPatternBindRequire(element, name)
      );
    }

    return current.properties.some((property) => {
      const next =
        property.type === 'Property' ? property.value : property.argument;
      return doesPatternBindRequire(next, name);
    });
  };

  const doesTargetDeclareRequire = (
    statement: Statement,
    name: string
  ): boolean => {
    if (statement.type === 'TSModuleDeclaration') {
      return 'name' in statement.id && statement.id.name === name;
    }
    if (
      statement.type === 'ClassDeclaration' ||
      statement.type === 'FunctionDeclaration' ||
      statement.type === 'TSEnumDeclaration'
    ) {
      return statement.id?.name === name;
    }
    return false;
  };

  const doesStatementDeclareRequire = (
    statement: Statement,
    name: string
  ): boolean => {
    if (statement.type === 'ExportNamedDeclaration') {
      return (
        statement.declaration !== null &&
        doesStatementDeclareRequire(statement.declaration, name)
      );
    }
    if (statement.type === 'VariableDeclaration') {
      return statement.declarations.some((declarator) =>
        doesPatternBindRequire(declarator.id, name)
      );
    }
    if (statement.type === 'ImportDeclaration') {
      return statement.specifiers.some(
        (specifier) => specifier.local.name === name
      );
    }
    if (statement.type === 'TSImportEqualsDeclaration') {
      return statement.id.name === name;
    }
    return doesTargetDeclareRequire(statement, name);
  };

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
