import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../_src@shared/_types/faf-config.type.js';

import { composeDeclarations } from './compose-declarations.util.js';

const EXAMPLE_CONFIG: TFAFConfig = {
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
        externalDependencies: [
          {
            from: [
              'src/_src@shared/_network/_apis/_apis@shared/_utils/legacy-client/legacy-client.util.ts',
            ],
            to: ['legacy/client.ts'],
          },
        ],
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
        publicRootNodes: ['src/app/app.tsx'],
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
        treeDependencies: [
          {
            from: ['src'],
            to: ['packages/contracts/src', 'packages/formatters/src'],
          },
        ],
      },
      {
        horizontalHierarchies: [[['_types'], ['_utils']]],
        rootLayers: ['packages/contracts/src', 'packages/formatters/src'],
      },
    ],
  },
};

describe('composeDeclarations', () => {
  it('identifies multiple trees with shared catalog from locals element', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          roles: [{ category: '_utils', name: 'util' }],
        },
        locals: [
          { rootLayers: ['packages/a/src', 'packages/b/src'] },
          { rootFragments: [{ path: 'app', rootNodes: [] }] },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.baseDirectory).toBe('/workspace');
    expect(result.value.aliases).toEqual([]);
    expect(result.value.trees).toHaveLength(3);

    const origins = result.value.trees.map((t) => t.originPath);
    expect(origins).toEqual(['packages/a/src', 'packages/b/src', 'app']);

    for (const tree of result.value.trees) {
      expect(tree.catalog.roles).toHaveLength(1);
      expect(tree.catalog.roles[0]?.name).toBe('util');
    }
  });

  it('local presence completely replaces common properties without merging', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          horizontalHierarchies: [[['_domain'], ['_ui']]],
          roles: [
            { category: '_types', isCategoryNode: true, name: 'type' },
            { category: '_utils', name: 'util' },
          ],
          subGraphRoles: [{ name: 'spec' }],
        },
        locals: [
          {
            horizontalHierarchies: [[['_queries']]],
            roles: [{ category: '_queries', name: 'query' }],
            rootLayers: ['src'],
            subGraphRoles: [],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const [tree] = result.value.trees;
    expect(tree?.catalog.roles).toHaveLength(1);
    expect(tree?.catalog.roles[0]?.name).toBe('query');
    expect(tree?.catalog.subGraphRoles).toEqual([]);
    expect(tree?.horizontalHierarchies).toEqual([[['_queries']]]);
  });

  it('applies default values after replacement', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          roles: [
            {
              allowMultipleSymbols: true,
              category: '_services',
              name: 'service',
            },
          ],
        },
        locals: [
          {
            roles: [{ category: '_services', name: 'service' }],
            rootLayers: ['src'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const [tree] = result.value.trees;
    const role = tree?.catalog.roles.find((r) => r.name === 'service');
    expect(role?.allowMultipleSymbols).toBe(false);
  });

  it('signals configuration error when roles is missing in both common and locals', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            rootLayers: ['src'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.outcomes).toHaveLength(1);
    expect(result.outcomes[0]).toEqual({
      constraint: 'configuration/missing-roles',
      element: 'fafconfig.ts',
      family: 'configuration',
      message:
        'Roles catalog is missing in both common and local configuration.',
      normativeReference: 'CONFIG_5',
      propertyPath: 'faf.locals[0]',
    });
  });

  it('allows roles to be empty array locally replacing common', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          roles: [{ category: '_utils', name: 'util' }],
        },
        locals: [
          {
            roles: [],
            rootLayers: ['src'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const [tree] = result.value.trees;
    expect(tree?.catalog.roles).toEqual([]);
    expect(tree?.catalog.topRank).toBe(0);
  });

  it('preserves property scope and default values across common and locals', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            roles: [{ category: '_utils', name: 'util' }],
            rootLayers: ['src'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const [tree] = result.value.trees;
    expect(tree?.catalog.subGraphRoles).toEqual([]);
    expect(tree?.foreignDomains).toEqual([]);
    expect(tree?.foreignNodes).toEqual({ families: [], individualPaths: [] });
    expect(tree?.horizontalHierarchies).toEqual([]);
    expect(tree?.localHorizontalHierarchies).toEqual([]);
    expect(tree?.mimeticPathStructures).toEqual([]);
    expect(tree?.publicRootNodes).toEqual([]);
    expect(tree?.treeDependencyPairs).toEqual([]);
    expect(tree?.externalDependencyPairs).toEqual([]);
    expect(tree?.rootFragments).toEqual([]);
  });

  it('rejects duplicate origin across different locals elements', () => {
    const config: TFAFConfig = {
      faf: {
        common: { roles: [{ category: '_utils', name: 'util' }] },
        locals: [{ rootLayers: ['src'] }, { rootLayers: ['src'] }],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    const outcome = result.outcomes[0];
    expect(outcome?.family).toBe('configuration');
    if (outcome?.family !== 'configuration') {
      return;
    }
    expect(outcome.constraint).toBe('configuration/duplicate-origin');
    expect(outcome.element).toBe('src');
    expect(outcome.propertyPath).toBe('faf.locals[1].rootLayers[0]');
  });

  it('rejects an origin designated as both Root Layer and Root Fragment', () => {
    const config: TFAFConfig = {
      faf: {
        common: { roles: [{ category: '_utils', name: 'util' }] },
        locals: [
          { rootLayers: ['src'] },
          { rootFragments: [{ path: 'src', rootNodes: [] }] },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.outcomes[0]?.constraint).toBe(
      'configuration/conflicting-origin-kind'
    );
    expect(result.outcomes[0]?.element).toBe('src');
  });

  it('rejects overlapping origins where one contains another', () => {
    const config: TFAFConfig = {
      faf: {
        common: { roles: [{ category: '_utils', name: 'util' }] },
        locals: [
          {
            rootFragments: [
              { path: 'src', rootNodes: [] },
              { path: 'src/app', rootNodes: [] },
            ],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.outcomes[0]?.constraint).toBe(
      'configuration/overlapping-origins'
    );
    expect(result.outcomes[0]?.element).toBe('src/app');
  });

  it('assigns positional rank to single roles and groups', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            roles: [
              [
                {
                  category: '_fonts',
                  implicitRoleExtensions: ['.woff2'],
                  name: 'font',
                },
                {
                  category: '_images',
                  implicitRoleExtensions: ['.png'],
                  name: 'image',
                },
              ],
              { category: '_types', isCategoryNode: true, name: 'type' },
              { category: '_components', name: 'component' },
            ],
            rootLayers: ['src'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const [tree] = result.value.trees;
    const font = tree?.catalog.roles.find((r) => r.name === 'font');
    const image = tree?.catalog.roles.find((r) => r.name === 'image');
    const type = tree?.catalog.roles.find((r) => r.name === 'type');
    const component = tree?.catalog.roles.find((r) => r.name === 'component');

    expect(font?.rank).toBe(0);
    expect(image?.rank).toBe(0);
    expect(type?.rank).toBe(1);
    expect(component?.rank).toBe(2);
    expect(tree?.catalog.topRank).toBe(3);
  });

  it('derives role form and default waiver', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            roles: [
              { category: '_utils', name: 'default-util' },
              {
                category: '_hooks',
                isCategoryNode: false,
                name: 'explicit-fragment',
              },
              {
                category: '_types',
                isCategoryNode: true,
                name: 'explicit-node',
              },
              {
                category: '_fonts',
                implicitRoleExtensions: ['.woff2'],
                name: 'implicit-node',
              },
              {
                category: '_images',
                implicitRoleExtensions: ['.png'],
                isCategoryNode: true,
                name: 'implicit-with-flag',
              },
            ],
            rootLayers: ['src'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const [tree] = result.value.trees;
    const roles = tree?.catalog.roles;
    expect(roles?.[0]?.form).toBe('fragments');
    expect(roles?.[0]?.allowMultipleSymbols).toBe(false);

    expect(roles?.[1]?.form).toBe('fragments');
    expect(roles?.[1]?.allowMultipleSymbols).toBe(false);

    expect(roles?.[2]?.form).toBe('category-nodes');
    expect(roles?.[2]?.allowMultipleSymbols).toBe(false);

    expect(roles?.[3]?.form).toBe('category-nodes');
    expect(roles?.[3]?.implicitExtensions).toEqual(['.woff2']);

    expect(roles?.[4]?.form).toBe('category-nodes');
    expect(roles?.[4]?.implicitExtensions).toEqual(['.png']);
  });

  it('analyzes multiple independent trees with distinct origins and catalogs', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            roles: [{ category: '_components', name: 'component' }],
            rootFragments: [{ path: 'client/src', rootNodes: [] }],
          },
          {
            roles: [{ category: '_services', name: 'service' }],
            rootLayers: ['server/src'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const clientTree = result.value.trees.find(
      (t) => t.originPath === 'client/src'
    );
    const serverTree = result.value.trees.find(
      (t) => t.originPath === 'server/src'
    );

    expect(clientTree?.originKind).toBe('root-fragment');
    expect(clientTree?.catalog.roles[0]?.name).toBe('component');

    expect(serverTree?.originKind).toBe('root-layer');
    expect(serverTree?.catalog.roles[0]?.name).toBe('service');
  });

  it('allows distinct trees to choose different forms for the same role name', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            roles: [{ category: '_utils', name: 'util' }],
            rootLayers: ['tree1'],
          },
          {
            roles: [{ category: '_utils', isCategoryNode: true, name: 'util' }],
            rootLayers: ['tree2'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const tree1 = result.value.trees.find((t) => t.originPath === 'tree1');
    const tree2 = result.value.trees.find((t) => t.originPath === 'tree2');

    expect(tree1?.catalog.roles[0]?.form).toBe('fragments');
    expect(tree2?.catalog.roles[0]?.form).toBe('category-nodes');
  });

  it('derives topRank from catalog and shares across tree', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            roles: [
              { category: '_a', name: 'a' },
              { category: '_b', name: 'b' },
              { category: '_c', name: 'c' },
              { category: '_d', name: 'd' },
            ],
            rootLayers: ['src'],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.trees[0]?.catalog.topRank).toBe(4);
  });

  it('expands root fragment authorization into Cartesian product pairs without duplicates', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            roles: [{ category: '_utils', name: 'util' }],
            rootFragments: [
              {
                dependencyEdges: [
                  {
                    from: ['a.ts', 'b.ts'],
                    to: ['other/c.ts', 'other/d.ts'],
                  },
                ],
                path: 'app',
                rootNodes: [['a.ts'], ['b.ts']],
              },
            ],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const [tree] = result.value.trees;
    const rf = tree?.rootFragments[0];
    expect(rf?.dependencyPairs).toEqual([
      { from: 'app/a.ts', to: 'other/c.ts' },
      { from: 'app/a.ts', to: 'other/d.ts' },
      { from: 'app/b.ts', to: 'other/c.ts' },
      { from: 'app/b.ts', to: 'other/d.ts' },
    ]);
  });

  it('expands tree relations into pairs using origins and Cartesian product', () => {
    const config: TFAFConfig = {
      faf: {
        locals: [
          {
            roles: [{ category: '_utils', name: 'util' }],
            rootLayers: ['a', 'b'],
            treeDependencies: [
              {
                from: ['a', 'b'],
                to: ['c', 'd'],
              },
            ],
          },
        ],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const treeA = result.value.trees.find((t) => t.originPath === 'a');
    expect(treeA?.treeDependencyPairs).toEqual([
      { from: 'a', to: 'c' },
      { from: 'a', to: 'd' },
      { from: 'b', to: 'c' },
      { from: 'b', to: 'd' },
    ]);
  });

  it('filters common references by tree belonging without rebasing paths', () => {
    const config: TFAFConfig = {
      faf: {
        common: {
          foreignNodes: [
            {
              paths: ['app', 'lib'],
              patterns: ['*.md'],
            },
          ],
          publicRootNodes: ['app/main.ts'],
          roles: [{ category: '_utils', name: 'util' }],
        },
        locals: [{ rootLayers: ['app'] }, { rootLayers: ['lib'] }],
      },
    };

    const result = composeDeclarations(config, '/workspace');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const appTree = result.value.trees.find((t) => t.originPath === 'app');
    const libraryTree = result.value.trees.find((t) => t.originPath === 'lib');

    expect(appTree?.publicRootNodes).toEqual(['app/main.ts']);
    expect(libraryTree?.publicRootNodes).toEqual([]);

    expect(appTree?.foreignNodes.families).toEqual([
      { paths: ['app'], patterns: ['*.md'] },
    ]);
    expect(libraryTree?.foreignNodes.families).toEqual([
      { paths: ['lib'], patterns: ['*.md'] },
    ]);
  });

  it('preserves custom ranks from integrated example fafconfig without imposing reference model', () => {
    const result = composeDeclarations(EXAMPLE_CONFIG, '/project');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.trees).toHaveLength(3);
    for (const tree of result.value.trees) {
      const catalog = tree.catalog;
      expect(catalog.topRank).toBe(14);
      expect(catalog.subGraphRoles).toEqual(['spec', 'story']);

      expect(catalog.roles.find((r) => r.name === 'font')?.rank).toBe(0);
      expect(catalog.roles.find((r) => r.name === 'image')?.rank).toBe(0);
      expect(catalog.roles.find((r) => r.name === 'style')?.rank).toBe(1);
      expect(catalog.roles.find((r) => r.name === 'constant')?.rank).toBe(2);
      expect(catalog.roles.find((r) => r.name === 'recipe')?.rank).toBe(3);
      expect(catalog.roles.find((r) => r.name === 'schema')?.rank).toBe(4);
      expect(catalog.roles.find((r) => r.name === 'type')?.rank).toBe(5);
      expect(catalog.roles.find((r) => r.name === 'mock')?.rank).toBe(6);
      expect(catalog.roles.find((r) => r.name === 'config')?.rank).toBe(7);
      expect(catalog.roles.find((r) => r.name === 'util')?.rank).toBe(8);
      expect(catalog.roles.find((r) => r.name === 'class')?.rank).toBe(9);
      expect(catalog.roles.find((r) => r.name === 'factory')?.rank).toBe(10);
      expect(catalog.roles.find((r) => r.name === 'instance')?.rank).toBe(11);
      expect(catalog.roles.find((r) => r.name === 'hook')?.rank).toBe(12);

      const tier13 = [
        'api',
        'boundary',
        'component',
        'context',
        'layout',
        'page',
        'route',
        'store',
      ];
      for (const name of tier13) {
        expect(catalog.roles.find((r) => r.name === name)?.rank).toBe(13);
      }
    }

    const srcTree = result.value.trees.find((t) => t.originPath === 'src');
    expect(srcTree?.foreignDomains).toEqual(['src/_configs']);
  });

  it('replaces general hierarchies while preserving the three local orderings in the first group', () => {
    const result = composeDeclarations(EXAMPLE_CONFIG, '/project');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const srcTree = result.value.trees.find((t) => t.originPath === 'src');
    const contractsTree = result.value.trees.find(
      (t) => t.originPath === 'packages/contracts/src'
    );
    const formattersTree = result.value.trees.find(
      (t) => t.originPath === 'packages/formatters/src'
    );

    expect(srcTree?.horizontalHierarchies).toEqual([
      [['_atoms'], ['_molecules'], ['_organisms'], ['_templates']],
      [
        ['_primitives'],
        ['_compounds'],
        ['_aggregates'],
        ['_systems'],
        ['_ecosystems'],
      ],
    ]);

    expect(srcTree?.localHorizontalHierarchies).toEqual([
      {
        hierarchy: [['_domain'], ['_network', '_state', '_ui']],
        paths: ['src/_src@shared'],
      },
      {
        hierarchy: [['_types'], ['_classes'], ['_utils'], ['_apis']],
        paths: ['src/_src@shared/_network'],
      },
      {
        hierarchy: [
          ['_constants'],
          ['_types'],
          ['_utils'],
          ['_recipes'],
          ['_components'],
          ['_pages'],
        ],
        paths: ['src/_src@shared/_ui'],
      },
    ]);

    expect(srcTree?.mimeticPathStructures).toEqual([
      {
        actions: ['get', 'list', 'delete', 'post', 'put', 'patch'],
        paths: ['src/_src@shared/_network/_apis'],
      },
    ]);

    expect(contractsTree?.horizontalHierarchies).toEqual([
      [['_types'], ['_utils']],
    ]);
    expect(formattersTree?.horizontalHierarchies).toEqual([
      [['_types'], ['_utils']],
    ]);

    expect(contractsTree?.localHorizontalHierarchies).toEqual([]);
    expect(formattersTree?.localHorizontalHierarchies).toEqual([]);
  });

  it('produces identical deterministic result when properties are declared in different order', () => {
    const configA: TFAFConfig = {
      faf: {
        common: {
          roles: [{ category: '_utils', name: 'util' }],
          subGraphRoles: [{ name: 'spec' }],
        },
        locals: [
          {
            publicRootNodes: ['src/app/b.ts', 'src/app/a.ts'],
            rootFragments: [
              {
                dependencyEdges: [
                  { from: ['y.ts', 'x.ts'], to: ['dest/2.ts', 'dest/1.ts'] },
                ],
                path: 'src',
                rootNodes: [['main.tsx'], ['main.css']],
              },
            ],
          },
        ],
      },
    };

    const keyCommon = 'common';
    const keyLocals = 'locals';
    const keyPath = 'path';
    const configB: TFAFConfig = {
      faf: {
        [keyCommon]: {
          roles: [{ category: '_utils', name: 'util' }],
          subGraphRoles: [{ name: 'spec' }],
        },
        [keyLocals]: [
          {
            publicRootNodes: ['src/app/a.ts', 'src/app/b.ts'],
            rootFragments: [
              {
                dependencyEdges: [
                  { from: ['x.ts', 'y.ts'], to: ['dest/1.ts', 'dest/2.ts'] },
                ],
                [keyPath]: 'src',
                rootNodes: [['main.tsx'], ['main.css']],
              },
            ],
          },
        ],
      },
    };

    const resultA = composeDeclarations(configA, '/base');
    const resultB = composeDeclarations(configB, '/base');

    expect(resultA).toEqual(resultB);
  });
});
