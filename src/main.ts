import type { TFafPlugin } from './main.type.js';

import pkg from '../package.json' with { type: 'json' };
import categoryMutuallyExclusive from './_rules/category-mutually-exclusive/index.js';
import enforceAccessNode from './_rules/enforce-access-node/index.js';
import namingConventions from './_rules/naming-conventions/index.js';
import noDirectFragmentImport from './_rules/no-direct-fragment-import/index.js';
import noFractalBranchLeak from './_rules/no-fractal-branch-leak/index.js';
import noPeerDependency from './_rules/no-peer-dependency/index.js';
import noPrivateCategoryLeak from './_rules/no-private-category-leak/index.js';

export const rules = {
  'category-mutually-exclusive': categoryMutuallyExclusive,
  'enforce-access-node': enforceAccessNode,
  'naming-conventions': namingConventions,
  'no-direct-fragment-import': noDirectFragmentImport,
  'no-fractal-branch-leak': noFractalBranchLeak,
  'no-peer-dependency': noPeerDependency,
  'no-private-category-leak': noPrivateCategoryLeak,
} as const;

export const configs: TFafPlugin['configs'] = {
  recommended: {
    plugins: {
      faf: {
        rules,
      },
    },
    rules: {
      'faf/category-mutually-exclusive': 'error',
      'faf/enforce-access-node': 'error',
      'faf/naming-conventions': 'error',
      'faf/no-direct-fragment-import': 'error',
      'faf/no-fractal-branch-leak': 'error',
      'faf/no-peer-dependency': 'error',
      'faf/no-private-category-leak': 'error',
    },
  },
};

const plugin: TFafPlugin = {
  configs,
  meta: {
    name: 'eslint-plugin-faf',
    version: pkg.version,
  },
  rules,
};

export default plugin;
