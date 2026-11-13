import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  compileInBothModes,
  WARMUP_TIMEOUT_MS,
  warmupTypeHarness,
} from './type-harness.js';

const EXAMPLE_CONFIG_SOURCE = `import type { TFAFConfig } from './src/main.js';

export default {
  faf: {
    common: {
      aliases: {
        '#/_apis@shared': 'src/_src@shared/_network/_apis/_apis@shared',
        '#/_src@shared': 'src/_src@shared',
      },
      foreignNodes: [
        {
          paths: ['src', 'packages/contracts/src', 'packages/formatters/src'],
          patterns: ['*.md'],
        },
      ],
      horizontalHierarchies: [
        [['_atoms'], ['_molecules'], ['_organisms'], ['_templates']],
        [
          ['_primitives'],
          ['_compounds'],
          ['_aggregates'],
          ['_systems'],
          ['_ecosystems'],
        ],
      ],
      roles: [
        [
          {
            category: '_fonts',
            implicitRoleExtensions: ['.ttf', '.woff', '.woff2'],
            name: 'font',
          },
          {
            category: '_images',
            implicitRoleExtensions: ['.png', '.jpg', '.jpeg', '.svg'],
            name: 'image',
          },
        ],
        {
          category: '_styles',
          implicitRoleExtensions: ['.css'],
          name: 'style',
        },
        {
          allowMultipleSymbols: true,
          category: '_constants',
          isCategoryNode: true,
          name: 'constant',
        },
        { allowMultipleSymbols: true, category: '_recipes', name: 'recipe' },
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
        {
          allowMultipleSymbols: true,
          category: '_mocks',
          isCategoryNode: true,
          name: 'mock',
        },
        { allowMultipleSymbols: true, category: '_configs', name: 'config' },
        { allowMultipleSymbols: true, category: '_utils', name: 'util' },
        { category: '_classes', name: 'class' },
        { category: '_factories', name: 'factory' },
        { category: '_instances', name: 'instance' },
        { category: '_hooks', name: 'hook' },
        [
          { category: '_apis', name: 'api' },
          { category: '_boundaries', name: 'boundary' },
          { category: '_components', name: 'component' },
          { category: '_contexts', name: 'context' },
          { category: '_layouts', name: 'layout' },
          { category: '_pages', name: 'page' },
          { category: '_routes', name: 'route' },
          { category: '_stores', name: 'store' },
        ],
      ],
      subGraphRoles: [{ name: 'spec' }, { name: 'story' }],
    },
    locals: [
      {
        foreignDomains: ['src/_configs'],
        foreignNodes: [
          'src/vite-env.d.ts',
          { paths: ['src'], patterns: ['*.md'] },
        ],
        localHorizontalHierarchies: [
          {
            hierarchies: [['_domain'], ['_network', '_state', '_ui']],
            paths: ['src/_src@shared'],
          },
          {
            hierarchies: [['_types'], ['_classes'], ['_utils'], ['_apis']],
            paths: ['src/_src@shared/_network'],
          },
          {
            hierarchies: [
              ['_constants'],
              ['_types'],
              ['_utils'],
              ['_recipes'],
              ['_components'],
              ['_pages'],
            ],
            paths: ['src/_src@shared/_ui'],
          },
        ],
        mimeticPathStructures: [
          {
            actions: ['get', 'list', 'delete', 'post', 'put', 'patch'],
            paths: ['src/_src@shared/_network/_apis'],
          },
        ],
        rootFragments: [
          {
            dependencyEdges: [
              {
                from: ['main.tsx'],
                to: ['src/app/app.tsx'],
              },
            ],
            path: 'src',
            rootNodes: [['main.css'], ['main.tsx']],
            subRootFragments: [
              {
                path: 'src/app',
                rootNodes: [['app.tsx']],
              },
            ],
          },
        ],
        publicRootNodes: ['src/app/app.tsx'],
        treeDependencies: [
          {
            from: ['src'],
            to: ['packages/contracts/src', 'packages/formatters/src'],
          },
        ],
        externalDependencies: [
          {
            from: [
              'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/legacy-client.util.ts',
            ],
            to: ['legacy/client.ts'],
          },
        ],
      },
      {
        rootLayers: ['packages/contracts/src', 'packages/formatters/src'],
        horizontalHierarchies: [[['_types'], ['_utils']]],
      },
    ],
  },
} satisfies TFAFConfig;
`;

const HYPOTHETICAL_PATHS = [
  'packages/contracts/src',
  'packages/formatters/src',
  'legacy/client.ts',
  'src/app/app.tsx',
] as const;

describe('example configuration compilation', () => {
  beforeAll(() => {
    warmupTypeHarness();
  }, WARMUP_TIMEOUT_MS);

  it('compiles multi-tree example fafconfig.ts in both exactOptionalPropertyTypes modes', () => {
    const result = compileInBothModes(EXAMPLE_CONFIG_SOURCE);
    expect(result.strictErrors).toHaveLength(0);
    expect(result.looseErrors).toHaveLength(0);
  });

  it('compiles without asserting physical existence of its hypothetical paths in repository', () => {
    const rootDirectory = process.cwd();
    for (const hypotheticalRelativePath of HYPOTHETICAL_PATHS) {
      const fullPath = path.resolve(rootDirectory, hypotheticalRelativePath);
      expect(fs.existsSync(fullPath)).toBe(false);
    }
  });
});
