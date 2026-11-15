import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import {
  BINDING_PATTERN_TYPES,
  FUNCTION_AST_TYPES,
  REQUIRE_NAME,
} from '../../_extract-traversal-entries@shared/_constants/traversal-entries.constant.js';
import { isAstNode } from '../../_extract-traversal-entries@shared/_utils/is-ast-node/index.js';

export function doesNodeDeclareRequire(
  node: TAstNode,
  name: string = REQUIRE_NAME
): boolean {
  const doesPatternBindRequire = (pattern: TAstNode): boolean => {
    let current = pattern;
    while (
      current.type === 'AssignmentPattern' ||
      current.type === 'RestElement'
    ) {
      const inner =
        current.type === 'AssignmentPattern'
          ? current['left']
          : current['argument'];
      if (!isAstNode(inner)) {
        return false;
      }
      current = inner;
    }

    if (current.type === 'Identifier') {
      return current['name'] === name;
    }

    if (current.type === 'ArrayPattern') {
      const elements = current['elements'];
      return (
        Array.isArray(elements) &&
        elements.some(
          (element) => isAstNode(element) && doesPatternBindRequire(element)
        )
      );
    }

    const properties = current['properties'];
    return (
      Array.isArray(properties) &&
      properties.some((property) => {
        if (!isAstNode(property)) {
          return false;
        }
        const next =
          property.type === 'Property'
            ? property['value']
            : property['argument'];
        return isAstNode(next) && doesPatternBindRequire(next);
      })
    );
  };

  const doesTargetDeclareRequire = (statement: TAstNode): boolean => {
    const targetTypes = new Set([
      'ClassDeclaration',
      'FunctionDeclaration',
      'TSEnumDeclaration',
      'TSModuleDeclaration',
    ]);
    if (targetTypes.has(statement.type)) {
      const id = statement['id'];
      return isAstNode(id) && id['name'] === name;
    }
    return false;
  };

  const doesStatementDeclareRequire = (statement: TAstNode): boolean => {
    if (statement.type === 'ExportNamedDeclaration') {
      const declaration = statement['declaration'];
      return isAstNode(declaration) && doesStatementDeclareRequire(declaration);
    }
    if (statement.type === 'VariableDeclaration') {
      const declarations = statement['declarations'];
      return (
        Array.isArray(declarations) &&
        declarations.some(
          (declarator) =>
            isAstNode(declarator) &&
            isAstNode(declarator['id']) &&
            doesPatternBindRequire(declarator['id'])
        )
      );
    }
    if (statement.type === 'ImportDeclaration') {
      const specifiers = statement['specifiers'];
      return (
        Array.isArray(specifiers) &&
        specifiers.some(
          (specifier) =>
            isAstNode(specifier) &&
            isAstNode(specifier['local']) &&
            specifier['local']['name'] === name
        )
      );
    }
    if (statement.type === 'TSImportEqualsDeclaration') {
      const id = statement['id'];
      return isAstNode(id) && id['name'] === name;
    }
    return doesTargetDeclareRequire(statement);
  };

  const doesFunctionDeclareRequire = (functionNode: TAstNode): boolean => {
    const id = functionNode['id'];
    if (isAstNode(id) && id['name'] === name) {
      return true;
    }
    const parameters = functionNode['params'];
    if (
      Array.isArray(parameters) &&
      parameters.some(
        (parameter) =>
          isAstNode(parameter) &&
          BINDING_PATTERN_TYPES.has(parameter.type) &&
          doesPatternBindRequire(parameter)
      )
    ) {
      return true;
    }
    const body = functionNode['body'];
    if (isAstNode(body)) {
      const inner = body['body'];
      if (Array.isArray(inner)) {
        return inner.some(
          (statement) =>
            isAstNode(statement) && doesStatementDeclareRequire(statement)
        );
      }
    }
    return false;
  };

  const doesTargetNodeDeclareRequire = (): boolean => {
    if (node.type === 'Program' || node.type === 'BlockStatement') {
      const body = node['body'];
      return (
        Array.isArray(body) &&
        body.some(
          (statement) =>
            isAstNode(statement) && doesStatementDeclareRequire(statement)
        )
      );
    }
    if (FUNCTION_AST_TYPES.has(node.type)) {
      return doesFunctionDeclareRequire(node);
    }
    if (node.type === 'CatchClause') {
      const parameter = node['param'];
      return (
        isAstNode(parameter) &&
        BINDING_PATTERN_TYPES.has(parameter.type) &&
        doesPatternBindRequire(parameter)
      );
    }
    return false;
  };

  return doesTargetNodeDeclareRequire();
}
