import categoryMutuallyExclusive from './_rules/category-mutually-exclusive/index.js';
import enforceAccessNode from './_rules/enforce-access-node/index.js';
import namingConventions from './_rules/naming-conventions/index.js';
import noDirectFragmentImport from './_rules/no-direct-fragment-import/index.js';
import noFractalBranchLeak from './_rules/no-fractal-branch-leak/index.js';
import noPeerDependency from './_rules/no-peer-dependency/index.js';
import noPrivateCategoryLeak from './_rules/no-private-category-leak/index.js';

/**
 * Mapping of FAF rule identifiers to their respective ESLint rule modules.
 * All rules are namespaced under 'faf/*' when consumed in configurations.
 */
export const rules = {
  'category-mutually-exclusive': categoryMutuallyExclusive,
  'enforce-access-node': enforceAccessNode,
  'naming-conventions': namingConventions,
  'no-direct-fragment-import': noDirectFragmentImport,
  'no-fractal-branch-leak': noFractalBranchLeak,
  'no-peer-dependency': noPeerDependency,
  'no-private-category-leak': noPrivateCategoryLeak,
} as const;
