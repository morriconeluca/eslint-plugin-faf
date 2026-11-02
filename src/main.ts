import type { ESLint } from 'eslint';

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
} from './_src@shared/_domain/_types/faf-config.type.js';

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
