import type { ESLint } from 'eslint';

export const recommended: ESLint.Plugin['configs'] = {
  recommended: {
    rules: {
      'faf/conformity': 'error',
    },
  },
};
