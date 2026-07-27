import type { ESLint, Linter } from 'eslint';

export type TFafPlugin = Omit<ESLint.Plugin, 'configs'> & {
  configs: {
    recommended: Linter.Config;
  };
};
