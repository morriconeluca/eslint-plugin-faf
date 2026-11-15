import type { TFAFConfig } from './src/main.js';

export default {
  faf: {
    locals: [
      {
        externalDependencies: [{ from: ['src/main.ts'], to: ['package.json'] }],
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
            category: '_schemas',
            isCategoryNode: true,
            name: 'schema',
          },
          {
            allowMultipleSymbols: true,
            category: '_types',
            isCategoryNode: true,
            name: 'type',
          },
          [
            {
              allowMultipleSymbols: true,
              category: '_configs',
              isCategoryNode: true,
              name: 'config',
            },
            {
              allowMultipleSymbols: true,
              category: '_mocks',
              isCategoryNode: true,
              name: 'mock',
            },
          ],
          {
            allowMultipleSymbols: true,
            category: '_utils',
            name: 'util',
          },
          [
            { category: '_norms', name: 'norm' },
            { category: '_rules', name: 'rule' },
            { category: '_stores', name: 'store' },
          ],
        ],
        rootFragments: [{ path: 'src', rootNodes: [['main.ts']] }],
        subGraphRoles: [{ name: 'spec' }],
      },
    ],
  },
} as const satisfies TFAFConfig;
