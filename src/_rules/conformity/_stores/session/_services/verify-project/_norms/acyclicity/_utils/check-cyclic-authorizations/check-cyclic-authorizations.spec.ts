import { describe, expect, it } from 'vitest';

import type { TAcyclicityOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TEffectiveRootFragment,
  TEffectiveTree,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { verificationModel } from '../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { checkCyclicAuthorizations } from './check-cyclic-authorizations.util.js';

const createTreeDeclaration = ({
  originPath,
  rootFragments = [],
  treeDependencyPairs = [],
}: {
  readonly originPath: string;
  readonly rootFragments?: readonly TEffectiveRootFragment[];
  readonly treeDependencyPairs?: readonly {
    readonly from: string;
    readonly to: string;
  }[];
}): TEffectiveTree => ({
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
  treeDependencyPairs,
});

const createModel = ({
  files = [],
  trees,
}: {
  readonly files?: readonly (readonly [string, null | string])[];
  readonly trees: readonly TEffectiveTree[];
}): TVerificationModel => {
  const base = verificationModel();
  const inventoryItems = files.map(([path, treeOrigin], id) => ({
    depth: 1,
    id,
    isSymlink: false,
    kind: 'file' as const,
    parentId: null,
    path,
    preorderEnd: id,
    preorderStart: id,
    realPath: `/workspace/${path}`,
    treeOrigin,
  }));
  const pathToId = new Map(inventoryItems.map((item) => [item.path, item.id]));
  const realPathToId = new Map(
    inventoryItems.map((item) => [item.realPath, item.id])
  );
  const inventory: TInventory = {
    items: inventoryItems,
    pathToId,
    realPathToId,
  };

  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees,
      },
      inventory,
    },
  };
};

describe('checkCyclicAuthorizations', () => {
  it('returns empty array when there are no cyclic authorizations', () => {
    const model = createModel({
      trees: [
        createTreeDeclaration({
          originPath: 'a',
          treeDependencyPairs: [{ from: 'a', to: 'b' }],
        }),
        createTreeDeclaration({
          originPath: 'b',
          treeDependencyPairs: [{ from: 'b', to: 'c' }],
        }),
        createTreeDeclaration({
          originPath: 'c',
        }),
      ],
    });
    expect(checkCyclicAuthorizations(model, [], [])).toEqual([]);
  });

  it('reports unverified/cyclic-tree-authorization when reciprocal tree dependencies are unexercised', () => {
    const model = createModel({
      trees: [
        createTreeDeclaration({
          originPath: 'b',
          treeDependencyPairs: [{ from: 'b', to: 'a' }],
        }),
        createTreeDeclaration({
          originPath: 'a',
          treeDependencyPairs: [{ from: 'a', to: 'b' }],
        }),
      ],
    });
    expect(checkCyclicAuthorizations(model, [], [])).toEqual([
      {
        constraint: 'unverified/cyclic-tree-authorization',
        element: 'a',
        family: 'unverified',
        message:
          "'a' declares reciprocal tree dependencies without physical code cycle",
        normativeReference: 'D-04',
        reason: 'cyclic-tree-authorization',
      },
    ]);
  });

  it('suppresses unverified/cyclic-tree-authorization when tree cycle is exercised in code', () => {
    const model = createModel({
      files: [
        ['a/source.ts', 'a'],
        ['b/target.ts', 'b'],
        ['b/source.ts', 'b'],
        ['a/target.ts', 'a'],
      ],
      trees: [
        createTreeDeclaration({
          originPath: 'a',
          treeDependencyPairs: [{ from: 'a', to: 'b' }],
        }),
        createTreeDeclaration({
          originPath: 'b',
          treeDependencyPairs: [{ from: 'b', to: 'a' }],
        }),
      ],
    });
    const interTreeCycles: readonly TAcyclicityOutcome[] = [
      createOutcome('acyclicity/inter-tree-cycle', {
        cycle: [
          ['a/source.ts', 'b/target.ts'],
          ['b/source.ts', 'a/target.ts'],
        ],
        element: 'a/source.ts',
      }),
    ];
    expect(checkCyclicAuthorizations(model, interTreeCycles, [])).toEqual([]);
  });

  it('reports unverified/cyclic-root-authorization when reciprocal root dependency edges are unexercised', () => {
    const rootFragmentA: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
      path: 'src/a',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };
    const rootFragmentB: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/b/main.ts', to: 'src/a/main.ts' }],
      path: 'src/b',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };

    const model = createModel({
      trees: [
        createTreeDeclaration({
          originPath: 'src',
          rootFragments: [rootFragmentB, rootFragmentA],
        }),
      ],
    });
    expect(checkCyclicAuthorizations(model, [], [])).toEqual([
      {
        constraint: 'unverified/cyclic-root-authorization',
        element: 'src/a',
        family: 'unverified',
        message:
          "'src/a' declares reciprocal root dependency authorizations without physical code cycle",
        normativeReference: 'D-04',
        reason: 'cyclic-root-authorization',
      },
    ]);
  });

  it('suppresses unverified/cyclic-root-authorization when root cycle is physically exercised in code', () => {
    const rootFragmentA: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
      path: 'src/a',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };
    const rootFragmentB: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/b/main.ts', to: 'src/a/main.ts' }],
      path: 'src/b',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };

    const model = createModel({
      trees: [
        createTreeDeclaration({
          originPath: 'src',
          rootFragments: [rootFragmentA, rootFragmentB],
        }),
      ],
    });
    const dependencyCycles: readonly TAcyclicityOutcome[] = [
      createOutcome('acyclicity/dependency-cycle', {
        cycle: [['src/a/main.ts', 'src/b/main.ts', 'src/a/main.ts']],
        element: 'src/a/main.ts',
      }),
    ];
    expect(checkCyclicAuthorizations(model, [], dependencyCycles)).toEqual([]);
  });

  it('sorts multiple cyclic authorization outcomes deterministically', () => {
    const rootFragmentA: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/a/main.ts', to: 'src/b/main.ts' }],
      path: 'src/a',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };
    const rootFragmentB: TEffectiveRootFragment = {
      dependencyPairs: [{ from: 'src/b/main.ts', to: 'src/a/main.ts' }],
      path: 'src/b',
      rootNodes: [{ name: 'main.ts', rank: 0 }],
      subRootFragments: [],
    };

    const model = createModel({
      trees: [
        createTreeDeclaration({
          originPath: 'src',
          rootFragments: [rootFragmentA, rootFragmentB],
          treeDependencyPairs: [{ from: 'src', to: 'z' }],
        }),
        createTreeDeclaration({
          originPath: 'z',
          treeDependencyPairs: [{ from: 'z', to: 'src' }],
        }),
      ],
    });

    const outcomes = checkCyclicAuthorizations(model, [], []);
    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.element).toBe('src');
    expect(outcomes[1]?.element).toBe('src/a');
  });
});
