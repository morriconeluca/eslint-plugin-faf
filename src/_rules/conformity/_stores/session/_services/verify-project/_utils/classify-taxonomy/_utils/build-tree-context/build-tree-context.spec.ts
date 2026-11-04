import { describe, expect, it } from 'vitest';

import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { buildTreeContext } from './build-tree-context.util.js';

const treeOf = (overrides: Partial<TEffectiveTree> = {}): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 1,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-fragment',
  originPath: 'src',
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
  ...overrides,
});

const selection = {
  foreignDomainPaths: new Set<string>(),
  foreignNodePaths: new Set<string>(),
};

describe('buildTreeContext', () => {
  it('emits the foreign-origin outcome and removes the origin from foreign domains', () => {
    const result = buildTreeContext(
      treeOf({ foreignDomains: ['src'] }),
      0,
      () => ({ kind: 'absent', roleName: null }),
      {
        foreignDomainPaths: new Set(['src', 'src/vendor']),
        foreignNodePaths: new Set<string>(),
      }
    );

    expect(result.context.foreignDomainPaths.has('src')).toBe(false);
    expect(result.context.foreignDomainPaths.has('src/vendor')).toBe(true);
    expect(result.outcomes).toEqual([
      {
        constraint: 'configuration/incompatible-foreign-origin',
        element: 'src',
        family: 'configuration',
        message: "Origin 'src' is also designated as a Foreign Domain.",
        normativeReference: '§6.7',
        propertyPath: 'trees[0].foreignDomains',
      },
    ]);
  });

  it('indexes nested root fragments and rejects a root inside a foreign domain', () => {
    const result = buildTreeContext(
      treeOf({
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [
              {
                dependencyPairs: [],
                path: 'src/blog',
                rootNodes: [],
                subRootFragments: [],
              },
            ],
          },
        ],
      }),
      1,
      () => ({ kind: 'absent', roleName: null }),
      {
        foreignDomainPaths: new Set(['src/blog']),
        foreignNodePaths: new Set<string>(),
      }
    );

    expect(result.rootFragmentPropertyPaths.get('src')).toBe(
      'trees[1].rootFragments[0]'
    );
    expect(result.rootFragmentPropertyPaths.get('src/blog')).toBe(
      'trees[1].rootFragments[0].subRootFragments[0]'
    );
    expect(result.rootNodePropertyPaths.get('src/main.ts')).toBe(
      'trees[1].rootFragments[0].rootNodes'
    );
    expect(result.outcomes).toEqual([
      {
        constraint: 'configuration/incompatible-root-in-foreign-domain',
        element: 'src/blog',
        family: 'configuration',
        message:
          "Root Fragment 'src/blog' is designated inside a Foreign Domain.",
        normativeReference: '§6.2',
        propertyPath: 'trees[1].rootFragments[0].subRootFragments[0]',
      },
    ]);
  });

  it('drops a mimetic path that is designated more than once', () => {
    const result = buildTreeContext(
      treeOf({
        mimeticPathStructures: [
          { actions: null, paths: ['src/_pages', 'src/_apis'] },
          { actions: ['get'], paths: ['src/_pages'] },
        ],
      }),
      0,
      () => ({ kind: 'absent', roleName: null }),
      selection
    );

    expect([...result.context.mimeticPaths]).toEqual(['src/_apis']);
    expect(result.mimeticPropertyPaths.get('src/_pages')).toBeUndefined();
    expect(result.mimeticPropertyPaths.get('src/_apis')).toBe(
      'trees[0].mimeticPathStructures[0].paths[1]'
    );
    expect(result.outcomes).toEqual([
      {
        constraint: 'configuration/duplicate-mimetic-designation',
        element: 'src/_pages',
        family: 'configuration',
        message: "Mimetic path 'src/_pages' is designated more than once.",
        normativeReference: 'CONFIG_8',
        propertyPath: 'trees[0].mimeticPathStructures[1].paths[0]',
      },
    ]);
  });

  it('emits no declaration outcomes for a coherent tree', () => {
    const result = buildTreeContext(
      treeOf({
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [],
            subRootFragments: [],
          },
        ],
      }),
      0,
      () => ({ kind: 'absent', roleName: null }),
      selection
    );
    expect(result.outcomes).toEqual([]);
    expect(result.context.foreignDomainPaths.size).toBe(0);
  });
});
