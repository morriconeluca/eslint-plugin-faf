import { describe, expect, it } from 'vitest';

import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TEdgeMetadata } from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TExternalCrossing } from '../../_verify-project@shared/_types/_compounds/external-crossing.type.js';
import type {
  TEffectiveOrientedPair,
  TEffectiveTree,
} from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyTreeFrontier } from './index.js';

type TEntrySpec = {
  readonly path: string;
  readonly treeOrigin: null | string;
};

const toDependencyOutcome = (
  outcome: TOutcome | undefined
): TDependencyOutcome | undefined =>
  outcome !== undefined && outcome.family === 'dependency'
    ? outcome
    : undefined;

const createInventory = (entries: readonly TEntrySpec[]): TInventory => {
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();

  for (const [index, entry] of entries.entries()) {
    const item: TInventoryItem = {
      depth: 1,
      id: index,
      isSymlink: false,
      kind: 'file',
      parentId: null,
      path: entry.path,
      preorderEnd: index,
      preorderStart: index,
      realPath: `/repo/${entry.path}`,
      treeOrigin: entry.treeOrigin,
    };
    items.push(item);
    pathToId.set(entry.path, index);
    realPathToId.set(item.realPath, index);
  }

  return { items, pathToId, realPathToId };
};

const createTree = (
  originPath: string,
  treeDependencyPairs: readonly TEffectiveOrientedPair[] = []
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
  rootFragments: [],
  treeDependencyPairs,
});

const createEdge = (
  sourcePath: string,
  destinationPath: string,
  specifier = './target.js',
  importIndex = 0,
  line = 1
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex,
  isTypeOnly: false,
  position: { column: 1, line },
  sourcePath,
  specifier,
  syntaxKind: 'side-effect-import',
});

const createCrossing = (
  sourcePath: string,
  destinationPath: string,
  chain: readonly string[]
): TExternalCrossing => ({
  chain,
  destinationPath,
  importIndex: 0,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier: './ext.js',
});

describe('verifyTreeFrontier', () => {
  it('handles authorization and publication matrix for inter-tree direct edges', () => {
    const inventory = createInventory([
      { path: 'a/main.ts', treeOrigin: 'a' },
      { path: 'b/main.ts', treeOrigin: 'b' },
      { path: 'c/main.ts', treeOrigin: 'c' },
    ]);

    const edge = createEdge('a/main.ts', 'b/main.ts', '../b/main.js');

    const runCase = (
      isPublished: boolean,
      treeDependencyPairs: readonly TEffectiveOrientedPair[]
    ) => {
      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          declarations: {
            ...base.basis.declarations,
            trees: [
              createTree('a', treeDependencyPairs),
              createTree('b'),
              createTree('c'),
            ],
          },
          inventory,
        },
        graph: {
          ...base.graph,
          edgeMetadata: [edge],
        },
        surface: {
          trees: [{ nodes: isPublished ? ['b/main.ts'] : [], originPath: 'b' }],
        },
      };
      return verifyTreeFrontier(model);
    };

    const directAuthorized = runCase(true, [{ from: 'a', to: 'b' }]);
    expect(directAuthorized).toEqual([]);

    const authorizedUnpublished = runCase(false, [{ from: 'a', to: 'b' }]);
    expect(authorizedUnpublished).toHaveLength(1);
    const authedUnpub = toDependencyOutcome(authorizedUnpublished[0]);
    expect(authedUnpub?.constraint).toBe('dependency/tree-opacity');
    expect(authedUnpub?.from).toBe('a/main.ts');
    expect(authedUnpub?.to).toBe('b/main.ts');

    const publishedNoAuthorization = runCase(true, []);
    expect(publishedNoAuthorization).toHaveLength(1);
    const pubNoAuth = toDependencyOutcome(publishedNoAuthorization[0]);
    expect(pubNoAuth?.constraint).toBe('dependency/tree-authorization');
    expect(pubNoAuth?.from).toBe('a/main.ts');
    expect(pubNoAuth?.to).toBe('b/main.ts');

    const publishedInverseOnly = runCase(true, [{ from: 'b', to: 'a' }]);
    expect(publishedInverseOnly).toHaveLength(1);
    expect(publishedInverseOnly[0]?.constraint).toBe(
      'dependency/tree-authorization'
    );

    const publishedTransitiveOnly = runCase(true, [
      { from: 'a', to: 'c' },
      { from: 'c', to: 'b' },
    ]);
    expect(publishedTransitiveOnly).toHaveLength(1);
    expect(publishedTransitiveOnly[0]?.constraint).toBe(
      'dependency/tree-authorization'
    );

    const unpublishedUnauthorized = runCase(false, []);
    expect(unpublishedUnauthorized).toHaveLength(2);
    expect(unpublishedUnauthorized[0]?.constraint).toBe(
      'dependency/tree-authorization'
    );
    expect(unpublishedUnauthorized[1]?.constraint).toBe(
      'dependency/tree-opacity'
    );
  });

  it('verifies tree without exposed nodes rejects any import from outside', () => {
    const inventory = createInventory([
      { path: 'a/main.ts', treeOrigin: 'a' },
      { path: 'b/internal.ts', treeOrigin: 'b' },
    ]);
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTree('a', [{ from: 'a', to: 'b' }]), createTree('b')],
        },
        inventory,
      },
      graph: {
        ...base.graph,
        edgeMetadata: [createEdge('a/main.ts', 'b/internal.ts')],
      },
      surface: {
        trees: [{ nodes: [], originPath: 'b' }],
      },
    };

    const outcomes = verifyTreeFrontier(model);
    expect(outcomes).toHaveLength(1);
    const outcome = toDependencyOutcome(outcomes[0]);
    expect(outcome?.constraint).toBe('dependency/tree-opacity');
    expect(outcome?.to).toBe('b/internal.ts');
  });

  it('orders equivalent paths to the same destination deterministically', () => {
    const inventory = createInventory([
      { path: 'consumer.ts', treeOrigin: null },
      { path: 'b/target.ts', treeOrigin: 'b' },
    ]);
    const edgeA = createEdge(
      'consumer.ts',
      'b/target.ts',
      '#widget/index.js',
      0,
      1
    );
    const edgeB = createEdge('consumer.ts', 'b/target.ts', '#redirect', 1, 2);
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTree('b')],
        },
        inventory,
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeB, edgeA],
      },
      surface: {
        trees: [{ nodes: [], originPath: 'b' }],
      },
    };

    const outcomes = verifyTreeFrontier(model);
    expect(outcomes).toHaveLength(2);
    const first = toDependencyOutcome(outcomes[0]);
    const second = toDependencyOutcome(outcomes[1]);
    expect(first?.specifier).toBe('#widget/index.js');
    expect(second?.specifier).toBe('#redirect');
  });

  it('verifies crossings that are authorized, missing, and inverse', () => {
    const inventory = createInventory([
      { path: 'a/start.ts', treeOrigin: 'a' },
      { path: 'ext.ts', treeOrigin: null },
      { path: 'b/end.ts', treeOrigin: 'b' },
    ]);
    const crossing = createCrossing('a/start.ts', 'b/end.ts', [
      'a/start.ts',
      'ext.ts',
      'b/end.ts',
    ]);

    const runCrossing = (pairs: readonly TEffectiveOrientedPair[]) => {
      const base = verificationModel();
      const model: TVerificationModel = {
        ...base,
        basis: {
          ...base.basis,
          declarations: {
            ...base.basis.declarations,
            trees: [createTree('a', pairs), createTree('b')],
          },
          inventory,
        },
        crossings: [crossing],
        surface: {
          trees: [{ nodes: ['b/end.ts'], originPath: 'b' }],
        },
      };
      return verifyTreeFrontier(model);
    };

    const authorized = runCrossing([{ from: 'a', to: 'b' }]);
    expect(authorized).toEqual([]);

    const missing = runCrossing([]);
    expect(missing).toHaveLength(1);
    const missingOutcome = toDependencyOutcome(missing[0]);
    expect(missingOutcome?.constraint).toBe('dependency/tree-authorization');
    expect(missingOutcome?.chain).toEqual(['a/start.ts', 'ext.ts', 'b/end.ts']);

    const inverse = runCrossing([{ from: 'b', to: 'a' }]);
    expect(inverse).toHaveLength(1);
    const inverseOutcome = toDependencyOutcome(inverse[0]);
    expect(inverseOutcome?.constraint).toBe('dependency/tree-authorization');
    expect(inverseOutcome?.chain).toEqual(['a/start.ts', 'ext.ts', 'b/end.ts']);
  });

  it('allows external consumers importing public surface without requiring tree authorization', () => {
    const inventory = createInventory([
      { path: 'outside.ts', treeOrigin: null },
      { path: 'src/high.ts', treeOrigin: 'src' },
      { path: 'src/low.ts', treeOrigin: 'src' },
    ]);
    const edgeHigh = createEdge(
      'outside.ts',
      'src/high.ts',
      './src/high.js',
      0,
      1
    );
    const edgeLow = createEdge(
      'outside.ts',
      'src/low.ts',
      './src/low.js',
      1,
      2
    );
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTree('src')],
        },
        inventory,
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edgeHigh, edgeLow],
      },
      surface: {
        trees: [{ nodes: ['src/high.ts'], originPath: 'src' }],
      },
    };

    const outcomes = verifyTreeFrontier(model);
    expect(outcomes).toHaveLength(1);
    const outcome = toDependencyOutcome(outcomes[0]);
    expect(outcome?.constraint).toBe('dependency/tree-opacity');
    expect(outcome?.from).toBe('outside.ts');
    expect(outcome?.to).toBe('src/low.ts');
  });

  it('guarantees deterministic outcomes under input permutation', () => {
    const inventory = createInventory([
      { path: 'a/first.ts', treeOrigin: 'a' },
      { path: 'a/second.ts', treeOrigin: 'a' },
      { path: 'b/target1.ts', treeOrigin: 'b' },
      { path: 'b/target2.ts', treeOrigin: 'b' },
      { path: 'x.ts', treeOrigin: null },
    ]);
    const edge1 = createEdge(
      'a/first.ts',
      'b/target1.ts',
      '../b/target1.js',
      0,
      1
    );
    const edge2 = createEdge(
      'a/second.ts',
      'b/target2.ts',
      '../b/target2.js',
      0,
      1
    );
    const crossing1 = createCrossing('a/first.ts', 'b/target2.ts', [
      'a/first.ts',
      'x.ts',
      'b/target2.ts',
    ]);
    const base = verificationModel();
    const modelOrder1: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTree('a'), createTree('b')],
        },
        inventory,
      },
      crossings: [crossing1],
      graph: {
        ...base.graph,
        edgeMetadata: [edge1, edge2],
      },
      surface: {
        trees: [{ nodes: [], originPath: 'b' }],
      },
    };

    const modelOrder2: TVerificationModel = {
      ...modelOrder1,
      crossings: [crossing1],
      graph: {
        ...base.graph,
        edgeMetadata: [edge2, edge1],
      },
    };

    const outcomes1 = verifyTreeFrontier(modelOrder1);
    const outcomes2 = verifyTreeFrontier(modelOrder2);
    expect(outcomes1).toEqual(outcomes2);
  });

  it('does not mutate the verification model', () => {
    const inventory = createInventory([
      { path: 'a/start.ts', treeOrigin: 'a' },
      { path: 'b/end.ts', treeOrigin: 'b' },
    ]);
    const edge = createEdge('a/start.ts', 'b/end.ts');
    const base = verificationModel();
    const model: TVerificationModel = {
      ...base,
      basis: {
        ...base.basis,
        declarations: {
          ...base.basis.declarations,
          trees: [createTree('a'), createTree('b')],
        },
        inventory,
      },
      graph: {
        ...base.graph,
        edgeMetadata: [edge],
      },
      surface: {
        trees: [{ nodes: [], originPath: 'b' }],
      },
    };

    const serializedBefore = JSON.stringify(model);
    verifyTreeFrontier(model);
    const serializedAfter = JSON.stringify(model);
    expect(serializedAfter).toBe(serializedBefore);
  });
});
