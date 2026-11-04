import type { Linter } from 'eslint';

import packageJson from '../package.json' with { type: 'json' };
import { recommended } from './_configs/recommended.config.js';
import { createConformity } from './_rules/conformity/index.js';

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
  configs: {
    recommended: Linter.Config & {
      plugins: {
        readonly faf: TFafPlugin;
      };
    };
  };
  meta: {
    readonly name: string;
    readonly namespace: 'faf';
    readonly version: string;
  };
  rules: {
    conformity: ReturnType<typeof createConformity>;
  };
};

const conformity = createConformity(packageJson.version);

const plugins: { readonly faf: TFafPlugin } = {
  get faf(): TFafPlugin {
    return plugin;
  },
};

const plugin: TFafPlugin = {
  configs: {
    recommended: {
      ...recommended,
      plugins,
    },
  },
  meta: {
    name: packageJson.name,
    namespace: 'faf',
    version: packageJson.version,
  },
  rules: {
    conformity,
  },
};

export default plugin;
