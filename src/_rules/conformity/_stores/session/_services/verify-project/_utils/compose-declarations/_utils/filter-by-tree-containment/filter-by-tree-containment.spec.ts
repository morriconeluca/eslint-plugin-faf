import { describe, expect, it } from 'vitest';

import type { TFAFCommonConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';

import { assertInvariant } from '../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { filterByTreeContainment } from './filter-by-tree-containment.util.js';

const nonEmpty = (
  values: readonly string[]
): readonly [string, ...string[]] => {
  const [first, ...rest] = values;
  assertInvariant(first !== undefined, 'Expected a non-empty path list');
  return [first, ...rest];
};

const scopedDeclarations = (
  orderedPaths: readonly string[],
  orderedTargets: readonly string[]
) =>
  filterByTreeContainment('app', undefined, {
    externalDependencies: [
      { from: nonEmpty(orderedPaths), to: ['z.ts', '@t.ts'] },
    ],
    foreignDomains: orderedPaths,
    foreignNodes: orderedPaths,
    publicRootNodes: orderedPaths,
    rootLayers: ['app'],
    treeDependencies: [{ from: ['app'], to: nonEmpty(orderedTargets) }],
  });

describe('filterByTreeContainment', () => {
  it('applies default empty values when both local and common are empty', () => {
    const result = filterByTreeContainment('app', undefined, {
      rootLayers: ['app'],
    });

    expect(result.publicRootNodes).toEqual([]);
    expect(result.foreignDomains).toEqual([]);
    expect(result.foreignNodes).toEqual({ families: [], individualPaths: [] });
    expect(result.horizontalHierarchies).toEqual([]);
    expect(result.localHorizontalHierarchies).toEqual([]);
    expect(result.mimeticPathStructures).toEqual([]);
    expect(result.externalDependencyPairs).toEqual([]);
    expect(result.treeDependencyPairs).toEqual([]);
  });

  it('filters common references by tree belonging without rebasing paths and sorts items', () => {
    const common: TFAFCommonConfig = {
      externalDependencies: [
        {
          from: [
            'app/src/z-adapter.ts',
            'app/src/a-adapter.ts',
            'lib/src/adapter.ts',
          ],
          to: ['vendor/z.ts', 'vendor/a.ts'],
        },
        {
          from: ['app/src/a-adapter.ts'],
          to: ['vendor/a.ts'],
        },
      ],
      foreignDomains: ['app/_z_configs', 'app/_a_configs', 'lib/_configs'],
      foreignNodes: [
        'app/z-vite-env.d.ts',
        'app/a-vite-env.d.ts',
        'lib/vite-env.d.ts',
        {
          paths: ['app', 'lib'],
          patterns: ['*.md'],
        },
        {
          paths: ['other-tree'],
          patterns: ['*.txt'],
        },
      ],
      localHorizontalHierarchies: [
        {
          hierarchies: [['_types'], ['_utils']],
          paths: ['app/_shared', 'lib/_shared'],
        },
        {
          hierarchies: [['_constants']],
          paths: ['other-tree/_shared'],
        },
      ],
      mimeticPathStructures: [
        {
          actions: ['get', 'post'],
          paths: ['app/_apis', 'lib/_apis'],
        },
        {
          paths: ['app/_routes'],
        },
        {
          paths: ['other-tree/_apis'],
        },
      ],
      publicRootNodes: ['app/z-main.ts', 'app/a-main.ts', 'lib/main.ts'],
      treeDependencies: [
        {
          from: ['app', 'lib'],
          to: ['z-target', 'a-target'],
        },
        {
          from: ['app'],
          to: ['a-target'],
        },
      ],
    };

    const appResult = filterByTreeContainment('app', common, {
      rootLayers: ['app'],
    });

    expect(appResult.publicRootNodes).toEqual([
      'app/a-main.ts',
      'app/z-main.ts',
    ]);
    expect(appResult.foreignDomains).toEqual([
      'app/_a_configs',
      'app/_z_configs',
    ]);
    expect(appResult.foreignNodes).toEqual({
      families: [{ paths: ['app'], patterns: ['*.md'] }],
      individualPaths: ['app/a-vite-env.d.ts', 'app/z-vite-env.d.ts'],
    });
    expect(appResult.localHorizontalHierarchies).toEqual([
      {
        hierarchy: [['_types'], ['_utils']],
        paths: ['app/_shared'],
      },
    ]);
    expect(appResult.mimeticPathStructures).toEqual([
      {
        actions: ['get', 'post'],
        paths: ['app/_apis'],
      },
      {
        actions: null,
        paths: ['app/_routes'],
      },
    ]);
    expect(appResult.externalDependencyPairs).toEqual([
      { from: 'app/src/a-adapter.ts', to: 'vendor/a.ts' },
      { from: 'app/src/a-adapter.ts', to: 'vendor/z.ts' },
      { from: 'app/src/z-adapter.ts', to: 'vendor/a.ts' },
      { from: 'app/src/z-adapter.ts', to: 'vendor/z.ts' },
    ]);
    expect(appResult.treeDependencyPairs).toEqual([
      { from: 'app', to: 'a-target' },
      { from: 'app', to: 'z-target' },
    ]);

    const libraryResult = filterByTreeContainment('lib', common, {
      rootLayers: ['lib'],
    });

    expect(libraryResult.publicRootNodes).toEqual(['lib/main.ts']);
    expect(libraryResult.foreignDomains).toEqual(['lib/_configs']);
    expect(libraryResult.foreignNodes).toEqual({
      families: [{ paths: ['lib'], patterns: ['*.md'] }],
      individualPaths: ['lib/vite-env.d.ts'],
    });
    expect(libraryResult.localHorizontalHierarchies).toEqual([
      {
        hierarchy: [['_types'], ['_utils']],
        paths: ['lib/_shared'],
      },
    ]);
    expect(libraryResult.mimeticPathStructures).toEqual([
      {
        actions: ['get', 'post'],
        paths: ['lib/_apis'],
      },
    ]);
    expect(libraryResult.externalDependencyPairs).toEqual([
      { from: 'lib/src/adapter.ts', to: 'vendor/a.ts' },
      { from: 'lib/src/adapter.ts', to: 'vendor/z.ts' },
    ]);
    expect(libraryResult.treeDependencyPairs).toEqual([
      { from: 'lib', to: 'a-target' },
      { from: 'lib', to: 'z-target' },
    ]);
  });

  it('local presence completely replaces common values even with empty array', () => {
    const common: TFAFCommonConfig = {
      externalDependencies: [{ from: ['app/ext.ts'], to: ['outside.ts'] }],
      foreignDomains: ['app/_legacy'],
      foreignNodes: [{ paths: ['app'], patterns: ['*.md'] }],
      horizontalHierarchies: [[['_constants'], ['_utils']]],
      localHorizontalHierarchies: [
        { hierarchies: [['_a']], paths: ['app/_a'] },
      ],
      mimeticPathStructures: [{ paths: ['app/_apis'] }],
      publicRootNodes: ['app/main.ts'],
      treeDependencies: [{ from: ['app'], to: ['other'] }],
    };

    const result = filterByTreeContainment('app', common, {
      externalDependencies: [
        {
          from: ['app/b.ts', 'app/a.ts'],
          to: ['vendor/b.ts', 'vendor/a.ts'],
        },
        {
          from: ['app/a.ts'],
          to: ['vendor/a.ts'],
        },
      ],
      foreignDomains: ['app/_z', 'app/_a'],
      foreignNodes: [
        'app/z.d.ts',
        'app/a.d.ts',
        { paths: ['app/sub'], patterns: ['*.md'] },
      ],
      horizontalHierarchies: [[['_types'], ['_services']]],
      localHorizontalHierarchies: [
        { hierarchies: [['_local']], paths: ['app/_local'] },
      ],
      mimeticPathStructures: [
        { actions: ['list'], paths: ['app/_local_apis'] },
      ],
      publicRootNodes: ['app/z.ts', 'app/a.ts'],
      rootLayers: ['app'],
      treeDependencies: [
        { from: ['app'], to: ['z-target', 'a-target'] },
        { from: ['app'], to: ['a-target'] },
      ],
    });

    expect(result.foreignDomains).toEqual(['app/_a', 'app/_z']);
    expect(result.publicRootNodes).toEqual(['app/a.ts', 'app/z.ts']);
    expect(result.foreignNodes).toEqual({
      families: [{ paths: ['app/sub'], patterns: ['*.md'] }],
      individualPaths: ['app/a.d.ts', 'app/z.d.ts'],
    });
    expect(result.horizontalHierarchies).toEqual([[['_types'], ['_services']]]);
    expect(result.localHorizontalHierarchies).toEqual([
      { hierarchy: [['_local']], paths: ['app/_local'] },
    ]);
    expect(result.mimeticPathStructures).toEqual([
      { actions: ['list'], paths: ['app/_local_apis'] },
    ]);
    expect(result.externalDependencyPairs).toEqual([
      { from: 'app/a.ts', to: 'vendor/a.ts' },
      { from: 'app/a.ts', to: 'vendor/b.ts' },
      { from: 'app/b.ts', to: 'vendor/a.ts' },
      { from: 'app/b.ts', to: 'vendor/b.ts' },
    ]);
    expect(result.treeDependencyPairs).toEqual([
      { from: 'app', to: 'a-target' },
      { from: 'app', to: 'z-target' },
    ]);
  });

  it('handles root directory dot origin containing nested paths', () => {
    const common: TFAFCommonConfig = {
      foreignDomains: ['src/_configs'],
      publicRootNodes: ['src/main.ts'],
    };

    const result = filterByTreeContainment('.', common, {
      rootLayers: ['.'],
    });

    expect(result.publicRootNodes).toEqual(['src/main.ts']);
    expect(result.foreignDomains).toEqual(['src/_configs']);
  });

  it('orders paths and pairs by UTF-16 code units regardless of input order', () => {
    const paths = [
      'app/b.ts',
      'app/B.ts',
      'app/_a.ts',
      'app/@x.ts',
      'app/[id].ts',
    ];
    const reversed = [...paths];
    reversed.reverse();
    const expectedPaths = [
      'app/@x.ts',
      'app/B.ts',
      'app/[id].ts',
      'app/_a.ts',
      'app/b.ts',
    ];
    const targets = ['b', 'B', '_a', '@x', '[id]'];
    const expectedTargets = ['@x', 'B', '[id]', '_a', 'b'];
    const forward = scopedDeclarations(paths, targets);
    const reversedTargets = [...targets];
    reversedTargets.reverse();
    const backward = scopedDeclarations(reversed, reversedTargets);
    const expectedPairs = expectedPaths.flatMap((from) => [
      { from, to: '@t.ts' },
      { from, to: 'z.ts' },
    ]);
    const expectedTreePairs = expectedTargets.map((to) => ({
      from: 'app',
      to,
    }));

    expect(forward.publicRootNodes).toEqual(expectedPaths);
    expect(forward.foreignDomains).toEqual(expectedPaths);
    expect(forward.foreignNodes.individualPaths).toEqual(expectedPaths);
    expect(forward.externalDependencyPairs).toEqual(expectedPairs);
    expect(forward.treeDependencyPairs).toEqual(expectedTreePairs);
    expect(backward).toEqual(forward);
  });
});
