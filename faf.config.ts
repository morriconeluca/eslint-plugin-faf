import type { TFAFConfig } from './src/main.js';

export default {
  faf: {
    locals: [
      {
        externalDependencies: [{ from: ['src/main.ts'], to: ['package.json'] }],
        horizontalHierarchies: [
          {
            hierarchy: [['_constants', '_types'], ['_configs'], ['_utils']],
            path: 'src/_rules/conformity/_conformity@shared',
          },
          {
            hierarchy: [['_constants'], ['_schemas', '_types'], ['_utils']],
            path: 'src/_rules/conformity/_stores/session/_services/verify-project/_services/prepare-project/_utils/validate-config-format/_validate-config-format@shared',
          },
          {
            hierarchy: [['_constants', '_types'], ['_utils']],
            path: 'src/_rules/conformity/_stores/session/_services/verify-project/_services/prepare-project/_utils/validate-config-references/_validate-config-references@shared',
          },
          {
            hierarchy: [['_constants'], ['_utils']],
            path: 'src/_rules/conformity/_stores/session/_services/verify-project/_utils/classify-taxonomy/_classify-taxonomy@shared',
          },
          {
            hierarchy: [['_types'], ['_mocks']],
            path: 'src/_rules/conformity/_stores/session/_services/verify-project/_utils/derive-horizontal-hierarchies/_derive-horizontal-hierarchies@shared',
          },
          {
            hierarchy: [['_types'], ['_mocks', '_utils']],
            path: 'src/_rules/conformity/_stores/session/_services/verify-project/_verify-project@shared',
          },
          {
            hierarchy: [
              ['_constants', '_types', '_utils'],
              ['_adapters'],
              ['_stores'],
            ],
            path: 'src/_rules/conformity/_stores/session/_session@shared',
          },
        ],
        horizontalHierarchyModels: [
          [
            ['_primitives'],
            ['_compounds'],
            ['_aggregates'],
            ['_systems'],
            ['_ecosystems'],
          ],
        ],
        publicRootNodes: ['src/main.ts'],
        roles: [
          {
            allowMultipleSymbols: true,
            category: '_constants',
            isCategoryNode: true,
            name: 'constant',
          },
          { category: '_schemas', name: 'schema' },
          {
            allowMultipleSymbols: true,
            category: '_types',
            isCategoryNode: true,
            name: 'type',
          },
          {
            allowMultipleSymbols: true,
            category: '_mocks',
            isCategoryNode: true,
            name: 'mock',
          },
          {
            allowMultipleSymbols: true,
            category: '_configs',
            isCategoryNode: true,
            name: 'config',
          },
          { category: '_utils', name: 'util' },
          { category: '_norms', name: 'norm' },
          { category: '_adapters', name: 'adapter' },
          { category: '_services', name: 'service' },
          { category: '_stores', name: 'store' },
          { category: '_rules', name: 'rule' },
        ],
        rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
        subGraphRoles: [{ name: 'spec' }],
      },
    ],
  },
} as const satisfies TFAFConfig;
