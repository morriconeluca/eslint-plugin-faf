import type { TFafPlugin } from './types.js';

import { rules } from './rules.js';

/**
 * Predefined configuration presets exposed by the FAF ESLint plugin.
 * Includes the recommended flat configuration preset that registers the plugin
 * and activates all taxonomy and dependency rules as blocking "error" diagnostics.
 */
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
