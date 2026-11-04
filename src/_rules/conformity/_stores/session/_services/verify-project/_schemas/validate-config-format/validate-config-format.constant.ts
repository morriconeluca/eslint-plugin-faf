export const CONFIG_1 = 'CONFIG_1';
export const CONFIG_2 = 'CONFIG_2';
export const CONFIG_5 = 'CONFIG_5';

export const CONSTRAINT_NULL_FORBIDDEN = 'configuration/null-forbidden';
export const CONSTRAINT_INVALID_TYPE = 'configuration/invalid-type';
export const CONSTRAINT_EMPTY_LIST = 'configuration/empty-list';
export const CONSTRAINT_UNKNOWN_PROPERTY = 'configuration/unknown-property';
export const CONSTRAINT_MISSING_PROPERTY = 'configuration/missing-property';
export const CONSTRAINT_EXPLICIT_UNDEFINED = 'configuration/explicit-undefined';
export const CONSTRAINT_SCOPE_MISMATCH = 'configuration/scope-mismatch';
export const CONSTRAINT_MISSING_ORIGIN = 'configuration/missing-origin';

export const FAF_COMMON_PREFIX = 'faf.common';
export const FAF_LOCALS_PREFIX = 'faf.locals';

export const ROOT_ALLOWED_PROPERTIES = new Set(['faf']);

export const FAF_ALLOWED_PROPERTIES = new Set(['common', 'locals']);

export const COMMON_ALLOWED_PROPERTIES = new Set([
  'aliases',
  'externalDependencies',
  'foreignDomains',
  'foreignNodes',
  'horizontalHierarchies',
  'localHorizontalHierarchies',
  'mimeticPathStructures',
  'publicRootNodes',
  'roles',
  'subGraphRoles',
  'treeDependencies',
]);

export const LOCALS_ALLOWED_PROPERTIES = new Set([
  'externalDependencies',
  'foreignDomains',
  'foreignNodes',
  'horizontalHierarchies',
  'localHorizontalHierarchies',
  'mimeticPathStructures',
  'publicRootNodes',
  'roles',
  'rootFragments',
  'rootLayers',
  'subGraphRoles',
  'treeDependencies',
]);
