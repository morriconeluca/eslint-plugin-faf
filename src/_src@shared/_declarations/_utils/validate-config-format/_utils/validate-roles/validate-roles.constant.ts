export const CONFIG_2 = 'CONFIG_2';
export const CONFIG_3 = 'CONFIG_3';

export const CONSTRAINT_NULL_FORBIDDEN = 'configuration/null-forbidden';
export const CONSTRAINT_INVALID_TYPE = 'configuration/invalid-type';
export const CONSTRAINT_EMPTY_STRING = 'configuration/empty-string';
export const CONSTRAINT_EMPTY_LIST = 'configuration/empty-list';
export const CONSTRAINT_DUPLICATE_ELEMENT = 'configuration/duplicate-element';
export const CONSTRAINT_UNKNOWN_PROPERTY = 'configuration/unknown-property';
export const CONSTRAINT_MISSING_PROPERTY = 'configuration/missing-property';
export const CONSTRAINT_EXPLICIT_UNDEFINED = 'configuration/explicit-undefined';
export const CONSTRAINT_CATEGORY_NODE_MISMATCH =
  'configuration/implicit-extension-category-node-mismatch';
export const CONSTRAINT_INVALID_IMPLICIT_EXT =
  'configuration/invalid-implicit-extension';

export const ROLE_ALLOWED_PROPERTIES = new Set([
  'allowMultipleSymbols',
  'category',
  'implicitRoleExtensions',
  'isCategoryNode',
  'name',
]);

export const FORBIDDEN_CODE_EXTENSIONS = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
]);

export const GLOB_PATTERN_CHARACTERS = /[*?[\]{}!]/;
