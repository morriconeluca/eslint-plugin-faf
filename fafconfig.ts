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
            ['_utils'],
            ['_norms'],
            ['_adapters'],
            ['_services'],
            ['_stores'],
            ['_rules'],
          ],
        ],
        localHorizontalHierarchies: [
          {
            hierarchies: [
              ['_domain'],
              ['_declarations', '_syntax'],
              ['_inventory'],
              ['_taxonomy'],
              ['_graph'],
              ['_runtime'],
            ],
            paths: ['src/_src@shared'],
          },
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
} as const;
