export const BINDING_PATTERN_TYPES = new Set([
  'ArrayPattern',
  'AssignmentPattern',
  'Identifier',
  'ObjectPattern',
  'RestElement',
]);

export const FUNCTION_AST_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

export const REQUIRE_NAME = 'require';

export const UNSUPPORTED_REQUIRE_MESSAGE =
  'Unsupported non-literal require call';
