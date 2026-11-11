export const CONSTRAINT_CATEGORY_NODE_MISMATCH =
  'configuration/implicit-extension-category-node-mismatch';
export const CONSTRAINT_DUPLICATE_ELEMENT = 'configuration/duplicate-element';
export const CONSTRAINT_INVALID_IMPLICIT_EXT =
  'configuration/invalid-implicit-extension';

export const FORBIDDEN_CODE_EXTENSIONS = new Set([
  '.cjs',
  '.cts',
  '.d.cts',
  '.d.mts',
  '.d.ts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
]);

export const GLOB_PATTERN_CHARACTERS = /[*?[\]{}!]/;
