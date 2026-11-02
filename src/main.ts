import type { ESLint } from 'eslint';

type TFafPlugin = {
  readonly configs?: ESLint.Plugin['configs'];
  readonly meta: {
    readonly name: string;
    readonly version?: string;
  };
  readonly rules?: ESLint.Plugin['rules'];
};

export const meta = {
  name: '@morriconeluca/eslint-plugin-faf',
};

const plugin: TFafPlugin = {
  meta,
};

export default plugin;
