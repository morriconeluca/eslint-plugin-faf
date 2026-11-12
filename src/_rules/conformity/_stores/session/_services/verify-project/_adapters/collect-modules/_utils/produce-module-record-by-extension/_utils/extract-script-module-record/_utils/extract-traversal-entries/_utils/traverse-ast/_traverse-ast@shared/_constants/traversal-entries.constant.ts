export const BINDING_PATTERN_TYPES = new Set([
  'ArrayPattern',
  'AssignmentPattern',
  'Identifier',
  'ObjectPattern',
  'RestElement',
]);

export const EXPORTS_NAME = 'exports';

export const FUNCTION_AST_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

export const MODULE_NAME = 'module';

export const REQUIRE_NAME = 'require';

export const UNSUPPORTED_COMMONJS_MESSAGE =
  'CommonJS export assignment (module.exports / exports) is unsupported';

export const UNSUPPORTED_REQUIRE_MESSAGE =
  'Unsupported non-literal require call';
