import type { TFafPlugin } from './types.js';

import pkg from '../package.json' with { type: 'json' };
import { configs } from './configs.js';
import { rules } from './rules.js';

export { configs } from './configs.js';
export { rules } from './rules.js';

/**
 * Default export representing the ESLint plugin for the Fractal Architecture Framework (FAF).
 * Assembles configs, rules, and package metadata.
 *
 * Exposes rules and configs both as named exports (for backward compatibility/direct consumption)
 * and within the default plugin export container.
 */
const plugin: TFafPlugin = {
  configs,
  meta: {
    name: 'eslint-plugin-faf',
    version: pkg.version,
  },
  rules,
};

export default plugin;
