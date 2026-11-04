import type { ESLint } from 'eslint';

import { recommended } from './_configs/recommended.config.js';
import { conformity } from './_rules/conformity/index.js';

export type {
  TFAFCommonConfig,
  TFAFConfig,
  TFAFExternalDependency,
  TFAFForeignNodeFamily,
  TFAFHierarchy,
  TFAFLocalConfig,
  TFAFLocalHorizontalHierarchy,
  TFAFMimeticPathStructure,
  TFAFNonEmptyArray,
  TFAFRole,
  TFAFRoles,
  TFAFRootDependencyEdge,
  TFAFRootFragment,
  TFAFSharedConfig,
  TFAFSubGraphRole,
  TFAFTreeDependency,
} from './_src@shared/_types/faf-config.type.js';

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
  configs: recommended,
  meta,
  rules: {
    conformity,
  },
};

export default plugin;
