import { describe, expect, it } from 'vitest';

import type {
  TEffectiveDeclarations,
  TEffectiveRootFragment,
  TEffectiveTree,
} from '../../../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { isAuthorizedRootDependency } from './index.js';

const makeTree = (
  originPath: string,
  rootFragments: readonly TEffectiveRootFragment[]
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 0,
  },
  externalDependencyPairs: [],
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-fragment',
  originPath,
  publicRootNodes: [],
  rootFragments,
  treeDependencyPairs: [],
});

const makeDeclarations = (
  options: {
    readonly originPath?: string;
    readonly rootFragments?: readonly TEffectiveRootFragment[];
    readonly trees?: readonly TEffectiveTree[];
  } = {}
): TEffectiveDeclarations => {
  const defaultTree = makeTree(
    options.originPath ?? 'src',
    options.rootFragments ?? []
  );

  return {
    aliases: [],
    baseDirectory: '/project',
    trees: options.trees ?? [defaultTree],
  };
};

describe('isAuthorizedRootDependency', () => {
  it('returns false when tree origin is not found in declarations', () => {
    const declarations = makeDeclarations({ originPath: 'src' });

    expect(
      isAuthorizedRootDependency(
        'other/a.ts',
        'other/b.ts',
        'other',
        'other',
        declarations
      )
    ).toBe(false);
  });

  it('selects the matching tree among multiple trees', () => {
    const otherTree = makeTree('other', []);
    const matchingTree = makeTree('src', [
      {
        dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
        path: 'src/a',
        rootNodes: [{ name: 'main.ts', rank: 0 }],
        subRootFragments: [],
      },
    ]);
    const declarations = makeDeclarations({
      trees: [otherTree, matchingTree],
    });

    expect(
      isAuthorizedRootDependency(
        'src/a/main.ts',
        'src/b/main.ts',
        'src/a',
        'src',
        declarations
      )
    ).toBe(true);
  });

  it('returns false when source parent path does not match any root fragment', () => {
    const declarations = makeDeclarations({
      originPath: 'src',
      rootFragments: [
        {
          dependencyPairs: [],
          path: 'src/a',
          rootNodes: [{ name: 'main.ts', rank: 0 }],
          subRootFragments: [],
        },
      ],
    });

    expect(
      isAuthorizedRootDependency(
        'src/b/main.ts',
        'src/a/main.ts',
        'src/b',
        'src',
        declarations
      )
    ).toBe(false);
  });

  it('returns false when source root fragment has pairs with matching to but different from', () => {
    const declarations = makeDeclarations({
      originPath: 'src',
      rootFragments: [
        {
          dependencyPairs: [{ from: 'src/a/other.ts', to: 'src/b/main.ts' }],
          path: 'src/a',
          rootNodes: [{ name: 'main.ts', rank: 0 }],
          subRootFragments: [],
        },
      ],
    });

    expect(
      isAuthorizedRootDependency(
        'src/a/main.ts',
        'src/b/main.ts',
        'src/a',
        'src',
        declarations
      )
    ).toBe(false);
  });

  it('returns false when source root fragment has pairs with matching from but different to', () => {
    const declarations = makeDeclarations({
      originPath: 'src',
      rootFragments: [
        {
          dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/c/main.ts' }],
          path: 'src/a',
          rootNodes: [{ name: 'main.ts', rank: 0 }],
          subRootFragments: [],
        },
      ],
    });

    expect(
      isAuthorizedRootDependency(
        'src/a/main.ts',
        'src/b/main.ts',
        'src/a',
        'src',
        declarations
      )
    ).toBe(false);
  });

  it('returns true when source root fragment authorizes the pair directly', () => {
    const declarations = makeDeclarations({
      originPath: 'src',
      rootFragments: [
        {
          dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
          path: 'src/a',
          rootNodes: [{ name: 'main.ts', rank: 0 }],
          subRootFragments: [],
        },
      ],
    });

    expect(
      isAuthorizedRootDependency(
        'src/a/main.ts',
        'src/b/main.ts',
        'src/a',
        'src',
        declarations
      )
    ).toBe(true);
  });

  it('returns true when authorization resides in a nested subRootFragment', () => {
    const declarations = makeDeclarations({
      originPath: 'src',
      rootFragments: [
        {
          dependencyPairs: [],
          path: 'src',
          rootNodes: [{ name: 'main.ts', rank: 0 }],
          subRootFragments: [
            {
              dependencyPairs: [{ from: 'src/app/page.ts', to: 'src/main.ts' }],
              path: 'src/app',
              rootNodes: [{ name: 'page.ts', rank: 0 }],
              subRootFragments: [],
            },
          ],
        },
      ],
    });

    expect(
      isAuthorizedRootDependency(
        'src/app/page.ts',
        'src/main.ts',
        'src/app',
        'src',
        declarations
      )
    ).toBe(true);
  });
});
