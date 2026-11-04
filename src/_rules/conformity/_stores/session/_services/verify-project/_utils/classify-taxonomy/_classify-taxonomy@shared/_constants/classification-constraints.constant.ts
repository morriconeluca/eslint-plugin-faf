import type { TRoleAttribution } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';

export const ABSENT_ROLE: TRoleAttribution = {
  kind: 'absent',
  roleName: null,
};

export const ABSENT_ROLE_KIND = 'absent' as const;

export const ACCESS_NODE_FILE_NAME = 'index.ts';

export const CONFIGURATION_FAMILY = 'configuration' as const;

export const CONSTRAINT_CONTRADICTORY_ROOT_FOREIGN =
  'configuration/contradictory-root-foreign' as const;

export const CONSTRAINT_INCOMPATIBLE_FOREIGN_ORIGIN =
  'configuration/incompatible-foreign-origin' as const;

export const CONSTRAINT_INCOMPATIBLE_MIMETIC_DESIGNATION =
  'configuration/incompatible-mimetic-designation' as const;

export const CONSTRAINT_INCOMPATIBLE_ROOT_IN_FOREIGN =
  'configuration/incompatible-root-in-foreign-domain' as const;

export const CONSTRAINT_INVALID_EXTERNAL_DEPENDENCY_SOURCE =
  'configuration/invalid-external-dependency-source' as const;

export const CONSTRAINT_INVALID_PUBLIC_ROOT_NODE =
  'configuration/invalid-public-root-node' as const;

export const CONSTRAINT_UNDECLARED_SUB_ROOT_FRAGMENT =
  'configuration/undeclared-sub-root-fragment' as const;

export const CONSTRAINT_UNENUMERATED_ROOT_FILE =
  'configuration/unenumerated-root-file' as const;

export const DOMAIN_CATEGORY = 'category';

export const DOMAIN_FRAGMENT = 'fragment';

export const DOMAIN_FRACTAL_BRANCH = 'fractal-branch';

export const DOMAIN_LAYER = 'layer';

export const DOMAIN_PATH_SUB_CATEGORY = 'path-sub-category';

export const DOMAIN_ROOT_FRAGMENT = 'root-fragment';

export const DOMAIN_ROOT_LAYER = 'root-layer';

export const DOMAIN_SUB_CATEGORY = 'sub-category';

export const DOT_PATH = '.';

export const FORM_CATEGORY_NODES = 'category-nodes';

export const FORM_FRAGMENTS = 'fragments';

export const DUPLICATE_MIMETIC_CONSTRAINT =
  'configuration/duplicate-mimetic-designation' as const;

export const NORMATIVE_CONFIG_10 = 'CONFIG_10';

export const NORMATIVE_CONFIG_8 = 'CONFIG_8';

export const NORMATIVE_SECTION_6_2 = '§6.2';

export const NORMATIVE_SECTION_6_3_5 = '§6.3.5';

export const NORMATIVE_SECTION_6_7 = '§6.7';

export const NODE_ACCESS = 'access-node';

export const NODE_CATEGORY = 'category-node';

export const NODE_FOREIGN = 'foreign-node';

export const NODE_FRAGMENT = 'fragment-node';

export const NODE_MASTER = 'master-node';

export const NODE_ROOT = 'root-node';

export const NODE_SUB_GRAPH = 'sub-graph-node';

export const NODE_UNAUTHORIZED = 'unauthorized-logical-node';

export const ROLE_EXPLICIT = 'explicit';

export const SHARED_SUFFIX = '@shared';

export const SLASH = '/';

export const UNDERSCORE = '_';
