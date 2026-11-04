import type { TFAFConfig } from './src/main.js';

export default {
  faf: {
    locals: [
      {
        externalDependencies: [{ from: ['src/main.ts'], to: ['package.json'] }],
        horizontalHierarchies: [
          [
            ['_constants'],
            ['_types'],
            ['_mocks'],
            ['_configs'],
            ['_schemas'],
            ['_utils'],
            ['_norms'],
            ['_adapters'],
            ['_services'],
            ['_stores'],
            ['_rules'],
          ],
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
          { category: '_schemas', name: 'schema' },
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
