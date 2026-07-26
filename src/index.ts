import { noFooRule } from './rules/no-foo.js';

export const rules = {
  'no-foo': noFooRule,
};

export const configs = {
  recommended: {
    plugins: {
      faf: {
        rules,
      },
    },
    rules: {
      'faf/no-foo': 'error',
    },
  },
};

const plugin = {
  configs,
  meta: {
    name: 'eslint-plugin-faf',
    version: '1.0.0',
  },
  rules,
};

export default plugin;
export { noFooRule };
